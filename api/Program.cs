using System.Text.Json.Serialization;
using Azure.Identity;
using Azure.Monitor.OpenTelemetry.AspNetCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OfficeHours.Api.Data;
using OfficeHours.Api.Hubs;

var builder = WebApplication.CreateBuilder(args);

// In Azure, load secrets from Key Vault. They override appsettings.json.
// DefaultAzureCredential signs in with the Managed Identity in Azure, or `az login` locally.
var keyVaultUri = builder.Configuration["KeyVaultUri"];
if (!string.IsNullOrEmpty(keyVaultUri))
{
    builder.Configuration.AddAzureKeyVault(new Uri(keyVaultUri), new DefaultAzureCredential());
}

// Register services with the dependency injection container.
builder.Services.AddControllers()
    // Send enums as text ("Waiting") instead of numbers (0).
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddHealthChecks();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("Default"),
        // Retry brief connection drops, which Azure SQL has now and then.
        sql => sql.EnableRetryOnFailure()));
builder.Services.AddSignalR();

// Send requests, errors, and logs to Application Insights, only when it's configured (in Azure).
if (!string.IsNullOrEmpty(builder.Configuration["APPLICATIONINSIGHTS_CONNECTION_STRING"]))
{
    builder.Services.AddOpenTelemetry().UseAzureMonitor();
}

// TA accounts with ASP.NET Core Identity. It keeps accounts in our database (through
// AppDbContext) and comes with ready-made endpoints, mapped below. Signing in returns a
// bearer token, which the frontend sends with every TA request.
builder.Services.AddIdentityApiEndpoints<IdentityUser>(options =>
    {
        // Length matters more than symbols, so only ask for 8+ characters.
        options.Password.RequiredLength = 8;
        options.Password.RequireDigit = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;
    })
    .AddEntityFrameworkStores<AppDbContext>();
// The admin is the one account whose email matches Admin:Email. They can manage every course and TA.
var adminEmail = builder.Configuration["Admin:Email"];
builder.Services.AddAuthorizationBuilder()
    .AddPolicy("Admin", policy => policy
        .RequireAuthenticatedUser()
        .RequireAssertion(context =>
            !string.IsNullOrEmpty(adminEmail) &&
            string.Equals(context.User.Identity?.Name, adminEmail, StringComparison.OrdinalIgnoreCase)));

// Browsers only let a page call an API on another origin (scheme + host + port)
// if the API allows it. Allow the frontend's origins listed in configuration.
// SignalR's browser client sends credentials, so the policy must allow those too.
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

var app = builder.Build();

// Apply any pending EF migrations at startup, so a deploy also updates the database schema.
using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.Migrate();
}

app.UseCors();
// Authentication works out who is calling, from the bearer token if there is one.
// Authorization then checks they're allowed in, for endpoints marked [Authorize].
app.UseAuthentication();
app.UseAuthorization();

// Map incoming requests to endpoints.
app.MapControllers();
// Identity's endpoints: /api/auth/register, /api/auth/login, /api/auth/refresh, and a few more.
app.MapGroup("/api/auth").MapIdentityApi<IdentityUser>();
app.MapHealthChecks("/api/health");
app.MapHub<QueueHub>("/hubs/queue");

app.Run();

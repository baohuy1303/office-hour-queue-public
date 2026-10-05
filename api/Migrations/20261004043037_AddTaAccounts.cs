using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OfficeHours.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTaAccounts : Migration
    {
        // Up() runs when the migration is applied (`dotnet ef database update`).
        // EF wraps all of it in BEGIN TRANSACTION ... COMMIT, so it fully applies or not at all.
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Added by hand: existing courses have no TA account linked, so nobody could ever
            // manage them. Nothing is deployed yet, so they're only local test data.
            // Their queue entries go too (ON DELETE CASCADE).
            // DELETE FROM [Courses];
            migrationBuilder.Sql("DELETE FROM [Courses];");

            // TA accounts replace the shared passcode.
            // (EF first drops the column's default constraint, if it has one, because SQL Server
            // won't drop a column that still has one. This column doesn't.)
            // ALTER TABLE [Courses] DROP COLUMN [TaPasscodeHash];
            migrationBuilder.DropColumn(
                name: "TaPasscodeHash",
                table: "Courses");

            // Identity's main table: one row per TA account.
            // CREATE TABLE [AspNetUsers] (
            migrationBuilder.CreateTable(
                name: "AspNetUsers",
                columns: table => new
                {
                    //     [Id] nvarchar(450) NOT NULL,   -- a random GUID as text
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    //     [UserName] nvarchar(256) NULL,   -- Identity's register endpoint uses the email
                    UserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    //     [NormalizedUserName] nvarchar(256) NULL,   -- uppercase copy, for case-insensitive lookups
                    NormalizedUserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    //     [Email] nvarchar(256) NULL,
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    //     [NormalizedEmail] nvarchar(256) NULL,
                    NormalizedEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    //     [EmailConfirmed] bit NOT NULL,   -- stays false: we don't send emails
                    EmailConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    //     [PasswordHash] nvarchar(max) NULL,   -- salted hash; the password itself is never stored
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    //     [SecurityStamp] nvarchar(max) NULL,   -- changes with the password, which ends old sign-ins
                    SecurityStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    //     [ConcurrencyStamp] nvarchar(max) NULL,   -- stops two saves from overwriting each other
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    //     [PhoneNumber] nvarchar(max) NULL,   -- this column and the next two go unused
                    PhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    //     [PhoneNumberConfirmed] bit NOT NULL,
                    PhoneNumberConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    //     [TwoFactorEnabled] bit NOT NULL,
                    TwoFactorEnabled = table.Column<bool>(type: "bit", nullable: false),
                    //     [LockoutEnd] datetimeoffset NULL,   -- this column and the next two lock an account
                    //                                         -- for 5 minutes after 5 wrong passwords
                    LockoutEnd = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    //     [LockoutEnabled] bit NOT NULL,
                    LockoutEnabled = table.Column<bool>(type: "bit", nullable: false),
                    //     [AccessFailedCount] int NOT NULL,
                    AccessFailedCount = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    //     CONSTRAINT [PK_AspNetUsers] PRIMARY KEY ([Id])
                    table.PrimaryKey("PK_AspNetUsers", x => x.Id);
                });
            // );

            // The next three tables come with Identity, but we don't use them yet.

            // Extra facts about an account, like "is an admin".
            // CREATE TABLE [AspNetUserClaims] (
            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    //     [Id] int NOT NULL IDENTITY,
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    //     [UserId] nvarchar(450) NOT NULL,
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    //     [ClaimType] nvarchar(max) NULL,
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    //     [ClaimValue] nvarchar(max) NULL,
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    //     CONSTRAINT [PK_AspNetUserClaims] PRIMARY KEY ([Id]),
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    //     CONSTRAINT [FK_AspNetUserClaims_AspNetUsers_UserId] FOREIGN KEY ([UserId])
                    //         REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });
            // );

            // Sign-ins through another provider, like "Sign in with Microsoft".
            // CREATE TABLE [AspNetUserLogins] (
            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                columns: table => new
                {
                    //     [LoginProvider] nvarchar(450) NOT NULL,
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    //     [ProviderKey] nvarchar(450) NOT NULL,
                    ProviderKey = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    //     [ProviderDisplayName] nvarchar(max) NULL,
                    ProviderDisplayName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    //     [UserId] nvarchar(450) NOT NULL,
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    //     CONSTRAINT [PK_AspNetUserLogins] PRIMARY KEY ([LoginProvider], [ProviderKey]),
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    //     CONSTRAINT [FK_AspNetUserLogins_AspNetUsers_UserId] FOREIGN KEY ([UserId])
                    //         REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });
            // );

            // Small per-account secrets, like two-factor keys.
            // CREATE TABLE [AspNetUserTokens] (
            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    //     [UserId] nvarchar(450) NOT NULL,
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    //     [LoginProvider] nvarchar(450) NOT NULL,
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    //     [Name] nvarchar(450) NOT NULL,
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    //     [Value] nvarchar(max) NULL,
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    //     CONSTRAINT [PK_AspNetUserTokens] PRIMARY KEY ([UserId], [LoginProvider], [Name]),
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    //     CONSTRAINT [FK_AspNetUserTokens_AspNetUsers_UserId] FOREIGN KEY ([UserId])
                    //         REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });
            // );

            // Which TA runs which course. One row per (course, TA) pair.
            // CREATE TABLE [CourseTas] (
            migrationBuilder.CreateTable(
                name: "CourseTas",
                columns: table => new
                {
                    //     [CourseId] int NOT NULL,
                    CourseId = table.Column<int>(type: "int", nullable: false),
                    //     [UserId] nvarchar(450) NOT NULL,
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    // The pair is the key, so the same TA can't be added to a course twice.
                    //     CONSTRAINT [PK_CourseTas] PRIMARY KEY ([CourseId], [UserId]),
                    table.PrimaryKey("PK_CourseTas", x => new { x.CourseId, x.UserId });
                    // Deleting a TA account deletes its links.
                    //     CONSTRAINT [FK_CourseTas_AspNetUsers_UserId] FOREIGN KEY ([UserId])
                    //         REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE,
                    table.ForeignKey(
                        name: "FK_CourseTas_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    // Deleting a course deletes its links.
                    //     CONSTRAINT [FK_CourseTas_Courses_CourseId] FOREIGN KEY ([CourseId])
                    //         REFERENCES [Courses] ([Id]) ON DELETE CASCADE
                    table.ForeignKey(
                        name: "FK_CourseTas_Courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });
            // );

            // Indexes on the foreign keys make "everything for this account" fast.
            // CREATE INDEX [IX_AspNetUserClaims_UserId] ON [AspNetUserClaims] ([UserId]);
            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserClaims_UserId",
                table: "AspNetUserClaims",
                column: "UserId");

            // CREATE INDEX [IX_AspNetUserLogins_UserId] ON [AspNetUserLogins] ([UserId]);
            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserLogins_UserId",
                table: "AspNetUserLogins",
                column: "UserId");

            // Finding an account by email (signing in, adding a co-TA) is fast.
            // CREATE INDEX [EmailIndex] ON [AspNetUsers] ([NormalizedEmail]);
            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "NormalizedEmail");

            // No two accounts can share a user name. Since that's the email, emails are unique too.
            // CREATE UNIQUE INDEX [UserNameIndex] ON [AspNetUsers] ([NormalizedUserName])
            //     WHERE [NormalizedUserName] IS NOT NULL;
            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "AspNetUsers",
                column: "NormalizedUserName",
                unique: true,
                filter: "[NormalizedUserName] IS NOT NULL");

            // Makes "every course this TA runs" fast. (The primary key already covers CourseId first.)
            // CREATE INDEX [IX_CourseTas_UserId] ON [CourseTas] ([UserId]);
            migrationBuilder.CreateIndex(
                name: "IX_CourseTas_UserId",
                table: "CourseTas",
                column: "UserId");

            // After Up() succeeds, EF records the migration so it never runs twice:
            // INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
            // VALUES (N'20261004043037_AddTaAccounts', N'10.0.12');
        }

        // Down() undoes Up(). It runs when you roll back, e.g. `dotnet ef database update AddCourses`.
        // The courses that Up() deleted don't come back.
        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // DROP TABLE [AspNetUserClaims];
            migrationBuilder.DropTable(
                name: "AspNetUserClaims");

            // DROP TABLE [AspNetUserLogins];
            migrationBuilder.DropTable(
                name: "AspNetUserLogins");

            // DROP TABLE [AspNetUserTokens];
            migrationBuilder.DropTable(
                name: "AspNetUserTokens");

            // DROP TABLE [CourseTas];
            migrationBuilder.DropTable(
                name: "CourseTas");

            // Last, because the tables above point at it.
            // DROP TABLE [AspNetUsers];
            migrationBuilder.DropTable(
                name: "AspNetUsers");

            // ALTER TABLE [Courses] ADD [TaPasscodeHash] nvarchar(200) NOT NULL DEFAULT N'';
            migrationBuilder.AddColumn<string>(
                name: "TaPasscodeHash",
                table: "Courses",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");
        }
    }
}

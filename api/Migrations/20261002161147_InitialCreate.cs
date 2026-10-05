using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OfficeHours.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        // Up() runs when the migration is applied (`dotnet ef database update`).
        // EF wraps all of it in BEGIN TRANSACTION ... COMMIT, so it fully applies or not at all.
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // CREATE TABLE [QueueEntries] (
            migrationBuilder.CreateTable(
                name: "QueueEntries",
                columns: table => new
                {
                    //     [Id] uniqueidentifier NOT NULL,
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    //     [Name] nvarchar(50) NOT NULL,
                    Name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    //     [Topic] nvarchar(100) NOT NULL,
                    Topic = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    //     [Status] nvarchar(20) NOT NULL,
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    //     [JoinedAt] datetimeoffset NOT NULL,
                    JoinedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    //     [CalledAt] datetimeoffset NULL,
                    CalledAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    //     [FinishedAt] datetimeoffset NULL,
                    FinishedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    //     CONSTRAINT [PK_QueueEntries] PRIMARY KEY ([Id])
                    table.PrimaryKey("PK_QueueEntries", x => x.Id);
                });
            // );

            // CREATE TABLE [QueueSettings] (
            migrationBuilder.CreateTable(
                name: "QueueSettings",
                columns: table => new
                {
                    //     [Id] int NOT NULL IDENTITY,   -- IDENTITY = auto-increment: 1, 2, 3...
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    //     [IsOpen] bit NOT NULL,        -- bit = true/false (1/0)
                    IsOpen = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    //     CONSTRAINT [PK_QueueSettings] PRIMARY KEY ([Id])
                    table.PrimaryKey("PK_QueueSettings", x => x.Id);
                });
            // );

            // INSERT INTO [QueueSettings] ([Id], [IsOpen]) VALUES (1, 0);
            // EF turns IDENTITY_INSERT on around this, because Id is normally auto-generated.
            migrationBuilder.InsertData(
                table: "QueueSettings",
                columns: new[] { "Id", "IsOpen" },
                values: new object[] { 1, false });

            // After Up() succeeds, EF records the migration so it never runs twice:
            // INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
            // VALUES (N'20261002161147_InitialCreate', N'10.0.12');
        }

        // Down() undoes Up(). It runs when you roll back, e.g. `dotnet ef database update 0`.
        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // DROP TABLE [QueueEntries];
            migrationBuilder.DropTable(
                name: "QueueEntries");

            // DROP TABLE [QueueSettings];
            migrationBuilder.DropTable(
                name: "QueueSettings");
        }
    }
}

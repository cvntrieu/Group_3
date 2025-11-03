# HMI Backend

This guide shows how to set up the `backend` folder on a Windows developer machine using PowerShell and `winget` to install SQL Server and SQL Server Management Studio (SSMS). It also covers editing `appsettings.json`, installing EF tooling, and running `dotnet ef database update`.

## Quick summary

- Install SQL Server and SSMS using `winget` (or download installers from Microsoft).
- Configure a SQL login (SA) or enable Mixed Mode during install.
- Update `backend/api/appsettings.json` connection string.
- Run `dotnet restore`, build and `dotnet ef database update` from the `backend/api` project.

## 1) Prerequisites

- Windows 10/11 with PowerShell and `winget` available. To check winget:

```powershell
winget --version
```

- .NET SDK (check with `dotnet --version`). Install the SDK matching the project's target (likely .NET 8 or .NET 9).
- Git (repo already cloned).
- (Optional) SQL Server tools like `sqlcmd` or SSMS for GUI management.

If you don't have .NET SDK or Git, download from:

- https://dotnet.microsoft.com/en-us/download
- https://git-scm.com/download/win

## 2) Find the correct winget package IDs (recommended)

winget package IDs can change. Use search to find the latest available packages before installing:

```powershell
winget search "sql server"
winget search "management studio"
```

Look for official Microsoft packages in the results. Example install commands (replace <PackageId> with the ID you found):

```powershell
# Example (replace with the real ID you found):
winget install --id <PackageId-for-SQLServer> -e
winget install --id <PackageId-for-SSMS> -e
```

Notes:

- If winget lists an official Microsoft SQL Server package (e.g. developer/express), you can install it. If not, download the installer from Microsoft and run it.
- During SQL Server installation, choose Mixed Mode authentication and set a strong SA password (you'll need it for the connection string).

## 3) Example: manual install (if winget not available)

If you prefer manual installers, grab them here:

- SQL Server Developer/Express: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
- SSMS: https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms

## 4) Configure connection string in `appsettings.json`

Open (or create) `backend/api/appsettings.json`. If only `appsettings.Example.json` exists, copy it to `appsettings.json` and edit.

Example `appsettings.json` snippet (replace your_server_name and your_database_name if needed):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source={your_server_name}\\SQLEXPRESS;Initial Catalog={your_database_name};Integrated Security=True;Connect Timeout=30;Encrypt=False;TrustServerCertificate=False;ApplicationIntent=ReadWrite;MultiSubnetFailover=False"
  }
}
```

Notes:

- `Data Source=localhost\\SQLEXPRESS` is the default for named instances. If you installed SQL Server as a default instance, you can use `Data Source=localhost` instead.
- If you use Windows Authentication and your app supports it, a sample connection string would be: `Data Source=localhost\\SQLEXPRESS;Initial Catalog=HmiDb;Integrated Security=True;` (no `User Id`/`Password`).

## 5) Install EF Core tools (if not installed)

Recommended to install the global tool for convenience:

```powershell
dotnet tool install --global dotnet-ef
# If already installed, update:
dotnet tool update --global dotnet-ef
```

You can also run `dotnet ef` without a global tool if the project includes the CLI tool reference.

## 6) Restore, build, and apply EF migrations

Open PowerShell, then run these commands from the repository root or explicitly navigate to the API project directory:

```powershell
cd \api

# Restore and build
dotnet restore
dotnet build

# Apply migrations to create/update the database
dotnet ef database update
```

## 8) Run the API and verify

Start the API with:

```powershell
dotnet watch run
```

Open the shown URL with `http://localhost:5000/swagger/index.html` to test endpoints. Example curl test:

# Fable samples

## Building and running the samples

- Restore NPM dependencies: `yarn install`
- Restore NuGet dependencies: `dotnet restore`
- **Move to src folder**: `cd src`
- Restore NuGet dependencies to get fable cli working: `dotnet restore`
- Start Fable and Webpack dev server: `dotnet fable yarn-start`
- In your browser, open `localhost:8080/[EXAMPLE]` (e.g. `http://localhost:8080/ozmo`)

Any modification you do to the F# code will be reflected in the web page after saving.
If you want to write JS files to disk instead of using the development server,
run `dotnet fable yarn-build`.

## Adding a new sample

- Take one of the existing samples as a reference.
- Add the information about your sample to `public/samples.json5`: id, entry file (usually the .fsproj), title and description; in one of the three categories: "games", "visual" or "productivity".
- Add one folder named after the id of the sample to `src` directory and another one to `public`. The first one will contain the F# (and maybe JS) source files, while the second contains the public assets for the sample (like index.html, images, etc).
- Add the project to the `Fable.Samples.sln` solution: `dotnet sln add src/my-sample/My.Sample.fsproj`
- Restore NuGet dependencies: `dotnet restore`

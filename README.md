# Fable samples

## Building and running the samples

- Restore NPM dependencies: `yarn install`
- Restore Nuget dependencies: `dotnet restore Fable.Samples.sln`
- Start Fable and Webpack dev server: `dotnet fable yarn-start`
- In your browser, open `localhost:8080/[EXAMPLE]` (e.g. `http://localhost:8080/ozmo`)

Any modification you do to the F# code will be reflected in the web page after saving.
If you want to write JS files to disk instead of using the development server,
run `dotnet fable yarn-build`.

## Adding a new sample

- Create a new folder with the sample (take current samples as reference)
- Add the project to the `Fable.Samples.sln` solution (CLI: `dotnet sln Fable.Samples.sln add my-sample.fsproj`)
- Add the sample to `samples.json`

To reference the resulting bundle from the sample `index.html`, use:

```html
<script src="/build/[sample].js"></script>
```

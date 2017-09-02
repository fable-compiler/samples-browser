module DocGenerator.Main

open Fable.Core
open Fable.Core.JsInterop
open Fable.Import
open Fable.Import.Node.Exports
open Components
open Helpers

// Make sure to always resolve paths to avoid conflicts in generated JS files
// Check fable-splitter README for info about ${entryDir} macro

let templatePath = resolve "${entryDir}/files/template.hbs"
let publicPath = resolve "${entryDir}/../public"

type PageInfo =
  { Title: string
    TargetPath: string
    NavbarActivePage: string }

let render (info: PageInfo) =
    [ "title" ==> info.Title
      "root" ==> Path.relative(info.TargetPath, publicPath)
      "navbar" ==> (Navbar.root info.NavbarActivePage |> parseReactStatic)
      "body" ==> "<h1>Hello World!<h1>" ]
    |> parseTemplate templatePath
    |> writeFile info.TargetPath

{ Title = "Fable Browser Samples"
  TargetPath = Path.join(publicPath, "index.html")
  NavbarActivePage = Literals.Navbar.Samples }
|> render

module DocGenerator.Main

open Fable.Core
open Fable.Core.JsInterop
open Fable.Import
open Fable.Import.Node.Exports
open Fable.Helpers.React
open Fable.Helpers.React.Props
open Fulma.Elements
open Components
open Helpers

// Make sure to always resolve paths to avoid conflicts in generated JS files
// Check fable-splitter README for info about ${entryDir} macro

let samplesInfoPath = resolve "${entryDir}/../public/samples.json5"
let templatePath = resolve "${entryDir}/files/template.hbs"
let publicPath = resolve "${entryDir}/../public"

let parseJson5<'T>(json: string): 'T = import "parse" "json5"

type PageInfo =
  { Title: string
    TargetPath: string
    NavbarActivePage: string }

type SampleInfo =
  abstract entry: string
  abstract title: string
  abstract desc: string
  abstract img: string

type JsObj<'T> =
  [<Emit("$0[$1]")>]
  abstract Item: string->'T

let keyValuePairs (o: JsObj<'T>) =
  JS.Object.keys(o)
  |> Seq.map (fun k -> k, o.[k])

let renderSamples() =
  let samples =
    readFile samplesInfoPath
    |> parseJson5<JsObj<JsObj<SampleInfo>>>

  let samplesToList (cat: JsObj<SampleInfo>) =
    keyValuePairs cat |> Seq.map (fun (k,v) ->
      li [] [a [Href k] [str v.title]])
    |> Seq.toList

  div [Class "content"; Style [Margin "10px"]] [
    h2 [] [str "Fun and Games"]
    ul [] (samplesToList samples.["games"])
    h2 [] [str "Productivity"]
    ul [] (samplesToList samples.["productivity"])
    h2 [] [str "Visualizations"]
    ul [] (samplesToList samples.["visual"])
  ]

let renderHeader() =
  section [Class "fable-header"] [
    img [
      Class "fable-logo"
      Src "./img/fable_logo.png"
    ]
    div [Class "flex-1 has-text-right"] [
      h1 [Class "title is-1"] [str "Samples"]
      h1 [Class "subtitle is-3"] [str "Learn by playing!"]
    ]
  ]

let renderBody() =
  div [] [
    renderHeader()
    renderSamples()
  ]

let render (info: PageInfo) =
    [ "title" ==> info.Title
      "root" ==> Path.relative(info.TargetPath, publicPath)
      "navbar" ==> (Navbar.root info.NavbarActivePage |> parseReactStatic)
      "body" ==> (renderBody() |> parseReactStatic) ]
    |> parseTemplate templatePath
    |> writeFile info.TargetPath

{ Title = "Fable Browser Samples"
  TargetPath = Path.join(publicPath, "index.html")
  NavbarActivePage = Literals.Navbar.Samples }
|> render

module Components.Navbar

open Fable.Core.JsInterop
open Fable.Helpers.React
open Fable.Helpers.React.Props
open Fulma.Elements.Form
open DocGenerator.Helpers
open DocGenerator.Literals

let navButton classy href faClass txt =
  Control.control [] [
    a [Class (sprintf "button %s" classy); Href href] [
      span [Class "icon"] [
        i [Class (sprintf "fa %s" faClass)] []
      ]
      span [] [str txt ]
    ]
  ]

let navButtons =
  div [Class "navbar-item"]
    [ Field.field [ Field.isGroupedLeft ]
        [ navButton "twitter" "https://twitter.com/FableCompiler" "fa-twitter" "Twitter"
          navButton "github" "https://gitter.im/fable-compiler/Fable" "fa-comments" "Gitter" ] ]

let menuItem label page currentPage =
    a [
      classList ["navbar-item", true; "is-active", page = currentPage]
      Href page
    ] [str label]

let root currentPage =
  nav [Class "navbar"] [
    div [Class "navbar-brand"] [
      div [Class "navbar-item title is-4"] [str "Fable"]
      div [Class "navbar-burger"; Data("target", Navbar.MenuId)] [
        span [] []
        span [] []
        span [] []
      ]
    ]
    div [Id Navbar.MenuId; classList ["navbar-menu", true]] [
      div [Class "navbar-start"] [
        menuItem "Home" Navbar.Home currentPage
        menuItem "REPL" Navbar.Repl currentPage
        menuItem "Docs" Navbar.Docs currentPage
        menuItem "Samples" Navbar.Samples currentPage
        menuItem "FableConf" Navbar.FableConf currentPage
      ]
      div [Class "navbar-end"] [navButtons]
    ]
  ]

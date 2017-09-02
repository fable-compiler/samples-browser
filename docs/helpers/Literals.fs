namespace DocGenerator.Literals

module Fable =
  let [<Literal>] Root = "http://fable.io/"

module Navbar =
  let [<Literal>] Home = Fable.Root
  let [<Literal>] Repl = Fable.Root + "repl.html"
  let [<Literal>] Samples = Fable.Root + "samples-browser"
  let [<Literal>] Docs = Fable.Root + "docs"
  let [<Literal>] FableConf = Fable.Root + "fableconf"
  let [<Literal>] MenuId = "navMenu"

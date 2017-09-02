#r "packages/build/FAKE/tools/FakeLib.dll"
#r "System.IO.Compression.FileSystem"

open System
open System.IO
open System.Text.RegularExpressions
open System.Collections.Generic
open Fake
open Fake.AssemblyInfoFile
open Fake.Git
open Fake.ReleaseNotesHelper

#if MONO
// prevent incorrect output encoding (e.g. https://github.com/fsharp/FAKE/issues/1196)
System.Console.OutputEncoding <- System.Text.Encoding.UTF8
#endif

module Util =
    open System.Net

    let retryIfFails maxRetries f =
        let rec loop retriesRemaining =
            try
                f ()
            with _ when retriesRemaining > 0 ->
                loop (retriesRemaining - 1)
        loop maxRetries

    let (|RegexReplace|_|) =
        let cache = new Dictionary<string, Regex>()
        fun pattern (replacement: string) input ->
            let regex =
                match cache.TryGetValue(pattern) with
                | true, regex -> regex
                | false, _ ->
                    let regex = Regex pattern
                    cache.Add(pattern, regex)
                    regex
            let m = regex.Match(input)
            if m.Success
            then regex.Replace(input, replacement) |> Some
            else None

    let join pathParts =
        Path.Combine(Array.ofSeq pathParts)

    let run workingDir fileName args =
        printfn "CWD: %s" workingDir
        let fileName, args =
            if EnvironmentHelper.isUnix
            then fileName, args else "cmd", ("/C " + fileName + " " + args)
        let ok =
            execProcess (fun info ->
                info.FileName <- fileName
                info.WorkingDirectory <- workingDir
                info.Arguments <- args) TimeSpan.MaxValue
        if not ok then failwith (sprintf "'%s> %s %s' task failed" workingDir fileName args)

    let runAndReturn workingDir fileName args =
        printfn "CWD: %s" workingDir
        let fileName, args =
            if EnvironmentHelper.isUnix
            then fileName, args else "cmd", ("/C " + args)
        ExecProcessAndReturnMessages (fun info ->
            info.FileName <- fileName
            info.WorkingDirectory <- workingDir
            info.Arguments <- args) TimeSpan.MaxValue
        |> fun p -> p.Messages |> String.concat "\n"

    let visitFile (visitor: string->string) (fileName : string) =
        File.ReadAllLines(fileName)
        |> Array.map (visitor)
        |> fun lines -> File.WriteAllLines(fileName, lines)

        // This code is supposed to prevent OutOfMemory exceptions but it outputs wrong BOM
        // use reader = new StreamReader(fileName, encoding)
        // let tempFileName = Path.GetTempFileName()
        // use writer = new StreamWriter(tempFileName, false, encoding)
        // while not reader.EndOfStream do
        //     reader.ReadLine() |> visitor |> writer.WriteLine
        // reader.Close()
        // writer.Close()
        // File.Delete(fileName)
        // File.Move(tempFileName, fileName)

    let replaceLines (replacer: string->Match->string option) (reg: Regex) (fileName: string) =
        fileName |> visitFile (fun line ->
            let m = reg.Match(line)
            if not m.Success
            then line
            else
                match replacer line m with
                | None -> line
                | Some newLine -> newLine)

let root = __SOURCE_DIRECTORY__

let gitOwner = "fable-compiler"
let gitProject = "samples-browser"

let dotnetcliVersion = "2.0.0"
let mutable dotnetExePath = environVarOrDefault "DOTNET" "dotnet"

Target "Clean" (fun () ->
    !!"src/**/bin" ++ "test/**/bin" ++ "temp" |> CleanDirs
    // Don't delete whole obj folder to leave Paket cache
    !! "src/**/obj/*.nuspec" ++ "test/**/obj/*.nuspec"
      ++ "public/**/bundle.js*" |> DeleteFiles
    !! "src/**/bin" ++ "src/**/obj/" |> CleanDirs
)

Target "InstallDotNetSdk"  (fun () ->
    dotnetExePath <- DotNetCli.InstallDotNetSDK dotnetcliVersion
)

Target "Restore" (fun () ->
    Util.run root "yarn" "install"
    Util.run root dotnetExePath "restore Fable.Samples.Browser.sln"
)

let build () =
    Util.run (root </> "src") dotnetExePath "fable yarn-build --port free"

Target "Build" build
Target "BuildNoRestore" build

let bumpVersion() =
    let mutable newVersion = 0
    let reg = Regex(@"\?v=(\d+)")
    let mainFile = root </> "public/index.html"
    (reg, mainFile) ||> Util.replaceLines (fun line m ->
        newVersion <- (int m.Groups.[1].Value) + 1
        reg.Replace(line, sprintf "?v=%i" newVersion) |> Some)
    newVersion

let commit workingDir files message =
    match files with
    | Some files -> files |> List.iter (StageFile workingDir >> ignore)
    | None -> StageAll workingDir
    Git.Commit.Commit workingDir message

let publish () =
    let publishBranch = "gh-pages"
    let publishDir, tempDir = root </> "public", root </> "temp"
    let githubLink = sprintf "https://github.com/%s/%s.git" gitOwner gitProject

    // let newVersion = bumpVersion()
    // sprintf "Bump version (%i)" newVersion
    // |> commit root (Some [root </> "public/index.html"])

    CleanDir tempDir
    Repository.cloneSingleBranch root githubLink publishBranch tempDir
    CopyRecursive publishDir tempDir true |> ignore
    String.Format("Update site ({0:yyyy/MM/dd HH:mm})", DateTime.UtcNow)
    |> commit tempDir None
    Branches.push tempDir

Target "Publish" publish
Target "PublishNoRestore" publish

"Clean"
==> "InstallDotNetSdk"
==> "Restore"
==> "Build"
==> "Publish"

"BuildNoRestore"
==> "PublishNoRestore"

// Start build
RunTargetOrDefault "Build"

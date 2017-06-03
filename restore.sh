yarn install
dotnet restore Fable.proj
#dotnet restore Fable.Samples.sln
# Uncomment the previous line and remove all the following line when 
# this issue https://github.com/dotnet/cli/issues/6723 is fixed
dotnet restore canvas/Canvas.fsproj
dotnet restore funsnake/Funsnake.fsproj
dotnet restore hokusai/Hokusai.fsproj
dotnet restore lsystem/LSystem.fsproj
dotnet restore mandelbrot/Mandelbrot.fsproj
dotnet restore mario/Mario.fsproj
dotnet restore ozmo/Ozmo.fsproj
dotnet restore pacman/Pacman.fsproj
dotnet restore pixi/Pixi.fsproj
dotnet restore pong/Pong.fsproj
dotnet restore react-todomvc/React.TodoMVC.fsproj
dotnet restore samegame/SameGame.fsproj
dotnet restore vue-todomvc/Vue.TodoMVC.fsproj
dotnet restore webGLTerrain/webGLTerrain.fsproj
dotnet restore redux-todomvc/Redux.TodoMVC.fsproj
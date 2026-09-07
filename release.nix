let
  sources = import ./nix/sources.nix;
  pkgs = import sources.nixpkgs {
    overlays = [
      (final: prev: {
        nodejs-16_x = final.nodejs;
        npmlock2nix = pkgs.callPackage sources.npmlock2nix { };
        treefmt-nix = import sources.treefmt-nix;
      })
      (import ./overlay.nix)
    ];
  };
  treefmtEval = pkgs.treefmt-nix.evalModule pkgs {
    projectRootFile = "flake.nix";
    programs.nixfmt.enable = true;
  };
in
{
  inherit (pkgs) dist;
  devShell = pkgs.mkShell {
    inputsFrom = [ pkgs.dist ];
    nativeBuildInputs = [
      pkgs.simple-http-server
      pkgs.nodejs
      treefmtEval.config.build.wrapper
    ];
  };
  formatter = treefmtEval.config.build.wrapper;
  formatting-check = treefmtEval.config.build.check ./.;
}

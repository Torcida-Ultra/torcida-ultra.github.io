{
  description = "simplistic's website";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/8a2f738d9d1f1d986b5a4cd2fd2061a7127237d7";
    flake-parts.url = "github:hercules-ci/flake-parts";
    treefmt-nix.url = "github:numtide/treefmt-nix";
    treefmt-nix.inputs.nixpkgs.follows = "nixpkgs";
    npmlock2nix.url = "github:nix-community/npmlock2nix/9197bbf397d76059a76310523d45df10d2e4ca81";
    npmlock2nix.flake = false;
  };

  outputs =
    inputs@{ flake-parts, treefmt-nix, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = [ "x86_64-linux" ];
      imports = [
        treefmt-nix.flakeModule
      ];
      flake = {
        overlays.default = import ./overlay.nix;
      };
      perSystem =
        {
          system,
          self',
          pkgs,
          lib,
          ...
        }:
        {
          _module.args.pkgs = import inputs.nixpkgs {
            inherit system;
            overlays = [
              (final: prev: {
                nodejs-16_x = final.nodejs;
                npmlock2nix = pkgs.callPackage inputs.npmlock2nix { };
              })
              (import ./overlay.nix)
            ];
            config = { };
          };
          treefmt = {
            projectRootFile = ".git/config";
            programs.nixfmt-rfc-style.enable = true;
          };

          apps.gh-deploy = {
            type = "app";
            program = "${lib.getExe (
              pkgs.writeShellApplication {
                name = "gh-deploy";
                runtimeInputs = [ pkgs.coreutils ];
                text = ''
                  cp --no-preserve=mode -r ${self'.packages.dist}/* docs
                '';
              }
            )}";
          };

          packages = {
            inherit (pkgs) dist;
            default = self'.packages.dist;
          };
        };
    };
}

final: prev: {
  dist = final.callPackage ./default.nix { };
  gh-deploy = final.writeShellApplication {
    name = "gh-deploy";
    runtimeInputs = [ final.coreutils ];
    text = ''
      cp --no-preserve=mode -r ${final.dist}/* docs
    '';
  };
}

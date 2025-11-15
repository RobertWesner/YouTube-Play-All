module Main where

import Prelude
import Effect.Aff (launchAff_)
import Script (script)
import Effect (Effect)

main :: Effect Unit
main = launchAff_ script

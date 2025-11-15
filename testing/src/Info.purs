module Info where

import Prelude
import Effect.Class (liftEffect)
import Effect.Aff (Aff)
import Effect.Console (log)

info :: String -> Aff Unit
info msg =
    liftEffect $ log msg

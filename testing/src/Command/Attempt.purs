module Command.Attempt where

import Prelude
import Effect.Aff (Aff)
import Data.Either (Either(..))
import Lib.Info (info)

type Result a = Either String a
type Attempt a = Aff (Result a)

fail :: forall a. String -> Aff (Result a)
fail msg = pure (Left msg)

succeed :: forall a. a -> Aff (Result a)
succeed x = pure (Right x)

-- TODO: rework with `parallel` to assume failure after 10s timeout (akin to a Go `select { case time.After(10 * time.Second) }`)

retry :: forall a. Int -> Attempt a -> Aff (Result a)
retry tries attempt = do
    if tries <= 0 then fail "exceeded tries"
    else do
        result <- attempt
        case result of
            Left err -> info err *> retry (tries - 1) attempt
            Right res -> succeed res

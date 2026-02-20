module Command.Step
    ( startStep
    , step
    ) where

import Prelude
import Toppokki as T
import Effect.Aff (Aff)
import Data.Either (Either(..))
import Lib.Info (info)
import Lib.Helpers (ytpaSelector)
import Control.Monad.Except (runExcept)
import Foreign (isNull, isUndefined, readString)

type Err = String
type Result = Either Err Unit
type StepSetup = T.Page -> Aff Unit

fail :: String -> String -> Aff Result
fail label msg = pure (Left (label <> ": " <> msg))

succeed :: Aff Result
succeed = pure (Right unit)

startStep :: Aff (Either String Unit)
startStep = pure (Right unit)

step :: T.Page -> String -> String -> StepSetup -> Result -> Aff Result
step page label expected setup _ = do
    let fail' = fail label

    info $ "[" <> label <> "] Setup..."
    setup page
    info $ "[" <> label <> "] Testing for value \"" <> expected <> "\"..."

    _ <- T.pageWaitForSelector (T.Selector ytpaSelector) {} page
    val <- T.unsafeEvaluateStringFunction ("document.querySelector('" <> ytpaSelector <> "')?.href") page
    if isNull val || isUndefined val then
        fail' "querySelector failed"
    else
        case runExcept (readString val) of
            Left _ -> do
                fail' "readString failed"
            Right href ->
                if href == expected then do
                    succeed
                else do
                    fail' ("expectation failed, href=" <> href)

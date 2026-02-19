module Lib.Script
    ( browser
    , setup
    , startStep
    , step
    ) where

import Prelude
import Toppokki as T
import Foreign (isNull, isUndefined, readString)
import Control.Monad.Except (runExcept)
import Data.Either (Either(..))
import Lib.Helpers (setUpUserscript, waitForAndClick, ytpaSelector)
import Effect.Aff (Aff, delay)
import Lib.Info (info)
import Control.Monad.Error.Class (catchError)
import Data.Time.Duration (Milliseconds(Milliseconds))

type Err = String
type Result = Either Err Unit
type StepSetup = T.Page -> Aff Unit

--- setup ---

-- | Start a new browser.
-- |
-- | First argument toggles headless mode (false=headless, true=visible).
browser :: Boolean -> Aff T.Browser
browser visible = T.launch { args: [ "--no-sandbox", "--disable-setuid-sandbox" ], headless: not visible }

setup :: T.Browser -> Aff T.Page
setup browser' = do
    page <- T.newPage browser'

    setUpUserscript page
    T.goto (T.URL "https://youtube.com") page

    catchError (do
      info "Waiting to reject cookies..."
      waitForAndClick "button[aria-label*=\"Reject the use of cookies\"]" page
    ) (\_ -> do
      info "Skipping the wait and attempting to continue..."
      pure unit
    )

    info "Waiting for refresh to finish..."
    delay (Milliseconds 500.0)
    _ <- T.pageWaitForSelector (T.Selector "[aria-label*=\"Your YouTube history is off\"],[aria-label=\"Try searching to get started\"]") {} page
    delay (Milliseconds 1000.0)

    pure page

--- steps ---

fail :: String -> String -> Aff Result
fail label msg = pure (Left (label <> ": " <> msg))

succeed :: Aff Result
succeed = pure (Right unit)

startStep :: Aff (Either String Unit)
startStep = pure (Right unit)

step :: T.Page -> String -> String -> StepSetup -> Result -> Aff Result
step page label expected setup _ = do
    let fail' = fail label

    info $ "[" <> label <> "] Testing for value \"" <> expected <> "\"..."
    setup page

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

module Command.Script
    ( browser
    , setup
    ) where

import Prelude
import Toppokki as T
import Lib.Helpers (setUpUserscript, waitForAndClick)
import Effect.Aff (Aff, delay)
import Lib.Info (info)
import Control.Monad.Error.Class (catchError)
import Data.Time.Duration (Milliseconds(Milliseconds))

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

    -- TODO: check if this even actually works as intended, at best this causes my pipeline to be slow due to internal hard timeouts - i could pass a proper timeout but not from here without a new waitForAndClickWithTimeout
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

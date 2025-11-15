module Script where

import Prelude
import Toppokki as T
import Effect.Aff (Aff, delay)
import Info (info)
import Helpers (injectUserscript, waitForAndClick, ytpaSelector)
import Data.Time.Duration (Milliseconds(Milliseconds))
import Foreign (isNull, isUndefined, readString)
import Control.Monad.Except (runExcept)
import Data.Either (Either(..))

step :: String -> String -> T.Page -> (T.Page -> Aff Unit) -> Boolean -> Aff Boolean
step label expected page setup prev = do
    if prev then do
        info $ "[" <> label <> "] Testing for value \"" <> expected <> "\"..."
        setup page

        _ <- T.pageWaitForSelector (T.Selector ytpaSelector) {} page
        val <- T.unsafeEvaluateStringFunction ("document.querySelector('" <> ytpaSelector <> "')?.href") page
        if isNull val || isUndefined val then
            pure false
        else
            case runExcept (readString val) of
                Left _ -> do
                    info "ERROR"
                    pure false
                Right href ->
                    if href == expected then do
                        info "PASS"
                        pure true
                    else do
                        info ("FAIL: " <> href)
                        pure false
    else pure false

script :: Aff Unit
script = do
    -- Setup

    browser <- T.launch { headless: false } -- TODO: change it back
    page <- T.newPage browser

    T.goto (T.URL "https://youtube.com") page

    info "Waiting to reject cookies..."
    waitForAndClick "button[aria-label*=\"Reject the use of cookies\"]" page

    info "Waiting for refresh to finish..."
    T.waitForNavigation {} page
    _ <- T.pageWaitForSelector (T.Selector "[aria-label*=\"Your YouTube history is off\"]") {} page
    injectUserscript page

    info "Inputting search..."
    T.type_ (T.Selector ".ytSearchboxComponentInput") "Technology Connections" {} page
    T.click (T.Selector ".ytSearchboxComponentSearchButton") page

    info "Navigating..."
    let channelLinkSelector = ".channel-link[href=\"/@TechnologyConnections\"]"
    _ <- T.pageWaitForSelector (T.Selector channelLinkSelector) {} page
    T.click (T.Selector channelLinkSelector) page


    -- Actual testing

    result <- pure true
        >>= step "videos latest" "https://www.youtube.com/playlist?list=UULFy0tKL1T7wFoYcxCe0xjN6Q&playnext=1" page (
            \page' -> do
                waitForAndClick "yt-tab-shape[tab-title=\"Videos\"]" page
                pure unit
        )
        >>= step "failme" "deliberate failure" page (\page' -> pure unit)

    if result == true
        then info "ALL TESTS PASSED!"
        else info "UNFORTUNATE FAILURE..."

    -- Shutdown

    info "..." -- TODO: this is just for checking
    delay (Milliseconds 10000000.0)

    T.close browser

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
                        info ("FAIL: \"" <> href <> "\"")
                        pure false
    else pure false

script :: Aff Unit
script = do
    -- Setup

    browser <- T.launch { args: ["--no-sandbox", "--disable-setuid-sandbox"] }
    page <- T.newPage browser

    T.goto (T.URL "https://youtube.com") page

    info "Waiting to reject cookies..."
    waitForAndClick "button[aria-label*=\"Reject the use of cookies\"]" page

    info "Waiting for refresh to finish..."
    delay (Milliseconds 500.0)
    _ <- T.pageWaitForSelector (T.Selector "[aria-label*=\"Your YouTube history is off\"]") {} page
    delay (Milliseconds 1000.0)
    injectUserscript page
    delay (Milliseconds 1000.0)

    -- Actual testing

    result <- pure true
        >>= step "videos-latest" "https://www.youtube.com/playlist?list=UULFy0tKL1T7wFoYcxCe0xjN6Q&playnext=1" page (
            \page' -> do
                T.type_ (T.Selector ".ytSearchboxComponentInput") "Technology Connections" {} page'
                delay (Milliseconds 500.0)
                T.click (T.Selector ".ytSearchboxComponentSearchButton") page'
                delay (Milliseconds 500.0)
                let channelLinkSelector = ".channel-link[href=\"/@TechnologyConnections\"]"
                _ <- T.pageWaitForSelector (T.Selector channelLinkSelector) {} page'
                T.click (T.Selector channelLinkSelector) page'
                waitForAndClick "yt-tab-shape[tab-title=\"Videos\"]" page'
                delay (Milliseconds 500.0)
        )
        >>= step "videos-popular" "https://www.youtube.com/playlist?list=UULPy0tKL1T7wFoYcxCe0xjN6Q&playnext=1" page (
            \page' -> do
                waitForAndClick "#primary #chips yt-chip-cloud-chip-renderer:nth-child(2)" page'
                delay (Milliseconds 500.0)
                waitForAndClick ".ytSearchboxComponentClearButton" page'
                delay (Milliseconds 500.0)
                T.type_ (T.Selector ".ytSearchboxComponentInput") "Veritasium" {} page'
                delay (Milliseconds 500.0)
                T.click (T.Selector ".ytSearchboxComponentSearchButton") page'
                delay (Milliseconds 500.0)
                let channelLinkSelector = ".channel-link[href^=\"/@veritasium\"]"
                _ <- T.pageWaitForSelector (T.Selector channelLinkSelector) {} page'
                T.click (T.Selector channelLinkSelector) page'
                delay (Milliseconds 500.0)
                waitForAndClick "yt-tab-shape[tab-title=\"Videos\"]" page'
                delay (Milliseconds 500.0)
        )
        >>= step "videos-latest-2" "https://www.youtube.com/playlist?list=UULFy0tKL1T7wFoYcxCe0xjN6Q&playnext=1" page (
            \page' -> do
                waitForAndClick "#primary #chips yt-chip-cloud-chip-renderer:nth-child(1)" page'
                delay (Milliseconds 500.0)
        )
        >>= step "videos-popular-2" "https://www.youtube.com/playlist?list=UULPy0tKL1T7wFoYcxCe0xjN6Q&playnext=1" page (
            \page' -> do
                waitForAndClick "#primary #chips yt-chip-cloud-chip-renderer:nth-child(2)" page'
                delay (Milliseconds 500.0)
                waitForAndClick ".ytSearchboxComponentClearButton" page'
                delay (Milliseconds 500.0)
                T.type_ (T.Selector ".ytSearchboxComponentInput") "Veritasium" {} page'
                delay (Milliseconds 500.0)
                T.click (T.Selector ".ytSearchboxComponentSearchButton") page'
                delay (Milliseconds 500.0)
                let channelLinkSelector = ".channel-link[href^=\"/@veritasium\"]"
                _ <- T.pageWaitForSelector (T.Selector channelLinkSelector) {} page'
                T.click (T.Selector channelLinkSelector) page'
                delay (Milliseconds 500.0)
                waitForAndClick "yt-tab-shape[tab-title=\"Videos\"]" page'
                delay (Milliseconds 500.0)
        )
        >>= step "videos-latest-3" "https://www.youtube.com/playlist?list=UULFy0tKL1T7wFoYcxCe0xjN6Q&playnext=1" page (
            \page' -> do
                waitForAndClick "#primary #chips yt-chip-cloud-chip-renderer:nth-child(1)" page'
                delay (Milliseconds 500.0)
        )
        >>= step "videos-popular-3" "https://www.youtube.com/playlist?list=UULPy0tKL1T7wFoYcxCe0xjN6Q&playnext=1" page (
            \page' -> do
                waitForAndClick "#primary #chips yt-chip-cloud-chip-renderer:nth-child(2)" page'
                delay (Milliseconds 500.0)
                waitForAndClick ".ytSearchboxComponentClearButton" page'
                delay (Milliseconds 500.0)
                T.type_ (T.Selector ".ytSearchboxComponentInput") "Veritasium" {} page'
                delay (Milliseconds 500.0)
                T.click (T.Selector ".ytSearchboxComponentSearchButton") page'
                delay (Milliseconds 500.0)
                let channelLinkSelector = ".channel-link[href^=\"/@veritasium\"]"
                _ <- T.pageWaitForSelector (T.Selector channelLinkSelector) {} page'
                T.click (T.Selector channelLinkSelector) page'
                delay (Milliseconds 500.0)
                waitForAndClick "yt-tab-shape[tab-title=\"Videos\"]" page'
                delay (Milliseconds 500.0)
        )
        >>= step "reload-videos-latest" "https://www.youtube.com/playlist?list=UULFy0tKL1T7wFoYcxCe0xjN6Q&playnext=1" page (
            \page' -> do
                _ <- T.unsafeEvaluateStringFunction ("document.head.remove();document.body.innerHTML = '<div id=\"lock\">WAITING</div>';") page'
                delay (Milliseconds 500.0)
                _ <- T.pageWaitForSelector (T.Selector "#lock") {} page'
                delay (Milliseconds 500.0)
                T.goto (T.URL "https://www.youtube.com/@TechnologyConnections/videos") page'
                injectUserscript page'
                delay (Milliseconds 500.0)
                _ <- T.pageWaitForSelector (T.Selector "yt-tab-shape[tab-title=\"Videos\"]") {} page'
                delay (Milliseconds 500.0)
                _ <- T.pageWaitForSelector (T.Selector "yt-tab-shape[tab-title=\"Videos\"]") {} page'
                delay (Milliseconds 500.0)
                _ <- T.pageWaitForSelector (T.Selector "yt-tab-shape[tab-title=\"Videos\"]") {} page'
                delay (Milliseconds 500.0)
        )
        >>= step "reload-videos-popular" "https://www.youtube.com/playlist?list=UULPy0tKL1T7wFoYcxCe0xjN6Q&playnext=1" page (
            \page' -> do
                waitForAndClick "#primary #chips yt-chip-cloud-chip-renderer:nth-child(2)" page'
                delay (Milliseconds 500.0)
                waitForAndClick ".ytSearchboxComponentClearButton" page'
                delay (Milliseconds 500.0)
                T.type_ (T.Selector ".ytSearchboxComponentInput") "Veritasium" {} page'
                delay (Milliseconds 500.0)
                T.click (T.Selector ".ytSearchboxComponentSearchButton") page'
                delay (Milliseconds 500.0)
                let channelLinkSelector = ".channel-link[href^=\"/@veritasium\"]"
                _ <- T.pageWaitForSelector (T.Selector channelLinkSelector) {} page'
                T.click (T.Selector channelLinkSelector) page'
                delay (Milliseconds 500.0)
                waitForAndClick "yt-tab-shape[tab-title=\"Videos\"]" page'
                delay (Milliseconds 500.0)
        )
        >>= step "shorts-latest" "https://www.youtube.com/playlist?list=UUSHXnNibvR_YIdyPs8PZIBoEw&playnext=1" page (
            \page' -> do
                T.type_ (T.Selector ".ytSearchboxComponentInput") "Cathode Ray Dude CRD" {} page'
                delay (Milliseconds 500.0)
                T.click (T.Selector ".ytSearchboxComponentSearchButton") page'
                delay (Milliseconds 500.0)
                let channelLinkSelector = ".channel-link[href=\"/@CathodeRayDude\"]"
                _ <- T.pageWaitForSelector (T.Selector channelLinkSelector) {} page'
                T.click (T.Selector channelLinkSelector) page'
                waitForAndClick "yt-tab-shape[tab-title=\"Shorts\"]" page'
                delay (Milliseconds 500.0)
        )
        >>= step "shorts-popular" "https://www.youtube.com/playlist?list=UUPSXnNibvR_YIdyPs8PZIBoEw&playnext=1" page (
            \page' -> do
                waitForAndClick "#primary #chips yt-chip-cloud-chip-renderer:nth-child(2)" page'
                delay (Milliseconds 500.0)
                waitForAndClick ".ytSearchboxComponentClearButton" page'
                delay (Milliseconds 500.0)
                T.type_ (T.Selector ".ytSearchboxComponentInput") "Veritasium" {} page'
                delay (Milliseconds 500.0)
                T.click (T.Selector ".ytSearchboxComponentSearchButton") page'
                delay (Milliseconds 500.0)
                let channelLinkSelector = ".channel-link[href^=\"/@veritasium\"]"
                _ <- T.pageWaitForSelector (T.Selector channelLinkSelector) {} page'
                T.click (T.Selector channelLinkSelector) page'
                delay (Milliseconds 500.0)
                waitForAndClick "yt-tab-shape[tab-title=\"Videos\"]" page'
                delay (Milliseconds 500.0)
        )
        >>= step "mythbusters-fallback-videos-latest" "https://www.youtube.com/playlist?list=UULFhUAaNhjdc1aN5f_29BPrhw&playnext=1" page (
            \page' -> do
                waitForAndClick ".ytSearchboxComponentClearButton" page'
                delay (Milliseconds 500.0)
                T.type_ (T.Selector ".ytSearchboxComponentInput") "Mythbusters" {} page'
                delay (Milliseconds 500.0)
                T.click (T.Selector ".ytSearchboxComponentSearchButton") page'
                delay (Milliseconds 500.0)
                let channelLinkSelector = ".channel-link[href=\"/@Mythbusterstvshow\"]"
                _ <- T.pageWaitForSelector (T.Selector channelLinkSelector) {} page'
                T.click (T.Selector channelLinkSelector) page'
                delay (Milliseconds 500.0)
                waitForAndClick "yt-tab-shape[tab-title=\"Videos\"]" page'
                delay (Milliseconds 500.0)
        )
        >>= step "mythbusters-fallback-videos-popular" "https://www.youtube.com/playlist?list=UULPhUAaNhjdc1aN5f_29BPrhw&playnext=1" page (
            \page' -> do
                waitForAndClick "#primary #chips yt-chip-cloud-chip-renderer:nth-child(2)" page'
                delay (Milliseconds 500.0)
        )
        -- Test 1: Veritasium Videos (Latest)
        >>= step "veritasium-videos-latest" "https://www.youtube.com/playlist?list=UULFy0tKL1T7wFoYcxCe0xjN6Q&playnext=1" page (
            \page' -> do
                T.goto (T.URL "https://www.youtube.com/@veritasium/videos") page'
                injectUserscript page'
                delay (Milliseconds 1000.0)
        )

        -- Test 2: Veritasium Videos (Popular)
        >>= step "veritasium-videos-popular" "https://www.youtube.com/playlist?list=UULPy0tKL1T7wFoYcxCe0xjN6Q&playnext=1" page (
            \page' -> do
                waitForAndClick "#chips yt-chip-cloud-chip-renderer:nth-child(2)" page'
                delay (Milliseconds 1000.0)
        )

        -- Test 3: 3Blue1Brown Videos (Latest)
        >>= step "3b1b-videos-latest" "https://www.youtube.com/playlist?list=UULFy0tKL1T7wFoYcxCe0xjN6Q&playnext=1" page (
            \page' -> do
                T.goto (T.URL "https://www.youtube.com/@3blue1brown/videos") page'
                injectUserscript page'
                delay (Milliseconds 1000.0)
        )

        -- Test 4: 3Blue1Brown Videos (Popular)
        >>= step "3b1b-videos-popular" "https://www.youtube.com/playlist?list=UULPy0tKL1T7wFoYcxCe0xjN6Q&playnext=1" page (
            \page' -> do
                waitForAndClick "#chips yt-chip-cloud-chip-renderer:nth-child(2)" page'
                delay (Milliseconds 1000.0)
        )

        -- Test 5: Tom Scott Videos (Latest)
        >>= step "tomscott-videos-latest" "https://www.youtube.com/playlist?list=UULFy0tKL1T7wFoYcxCe0xjN6Q&playnext=1" page (
            \page' -> do
                T.goto (T.URL "https://www.youtube.com/@TomScottGo/videos") page'
                injectUserscript page'
                delay (Milliseconds 1000.0)
        )

        -- Test 6: Tom Scott Videos (Popular)
        >>= step "tomscott-videos-popular" "https://www.youtube.com/playlist?list=UULPy0tKL1T7wFoYcxCe0xjN6Q&playnext=1" page (
            \page' -> do
                waitForAndClick "#chips yt-chip-cloud-chip-renderer:nth-child(2)" page'
                delay (Milliseconds 1000.0)
        )
        >>= step "mythbusters-fallback-shorts-latest" "https://www.youtube.com/playlist?list=UUSHhUAaNhjdc1aN5f_29BPrhw&playnext=1" page (
            \page' -> do
                waitForAndClick "yt-tab-shape[tab-title=\"Shorts\"]" page'
                delay (Milliseconds 500.0)
        )
        >>= step "mythbusters-fallback-shorts-popular" "https://www.youtube.com/playlist?list=UUPShUAaNhjdc1aN5f_29BPrhw&playnext=1" page (
            \page' -> do
                waitForAndClick "#primary #chips yt-chip-cloud-chip-renderer:nth-child(2)" page'
                delay (Milliseconds 500.0)
                waitForAndClick ".ytSearchboxComponentClearButton" page'
                delay (Milliseconds 500.0)
                T.type_ (T.Selector ".ytSearchboxComponentInput") "Veritasium" {} page'
                delay (Milliseconds 500.0)
                T.click (T.Selector ".ytSearchboxComponentSearchButton") page'
                delay (Milliseconds 500.0)
                let channelLinkSelector = ".channel-link[href^=\"/@veritasium\"]"
                _ <- T.pageWaitForSelector (T.Selector channelLinkSelector) {} page'
                T.click (T.Selector channelLinkSelector) page'
                delay (Milliseconds 500.0)
                waitForAndClick "yt-tab-shape[tab-title=\"Videos\"]" page'
                delay (Milliseconds 500.0)
        )
        >>= step "live-latest" "https://www.youtube.com/playlist?list=UULV5uNya42ayhsRnZOR3mO6NA&playnext=1" page (
            \page' -> do
                _ <- T.unsafeEvaluateStringFunction ("document.head.remove();document.body.innerHTML = '<div id=\"lock\">WAITING</div>';") page'
                delay (Milliseconds 500.0)
                _ <- T.pageWaitForSelector (T.Selector "#lock") {} page'
                delay (Milliseconds 500.0)
                T.goto (T.URL "https://www.youtube.com/@Insym/streams") page'
                injectUserscript page'
                delay (Milliseconds 500.0)
                _ <- T.pageWaitForSelector (T.Selector "yt-tab-shape[tab-title=\"Live\"]") {} page'
                delay (Milliseconds 500.0)
                _ <- T.pageWaitForSelector (T.Selector "yt-tab-shape[tab-title=\"Live\"]") {} page'
                delay (Milliseconds 500.0)
                _ <- T.pageWaitForSelector (T.Selector "yt-tab-shape[tab-title=\"Live\"]") {} page'
                delay (Milliseconds 500.0)
        )
        >>= step "live-popular" "https://www.youtube.com/playlist?list=UUPV5uNya42ayhsRnZOR3mO6NA&playnext=1" page (
            \page' -> do
                waitForAndClick "#primary #chips yt-chip-cloud-chip-renderer:nth-child(2)" page'
                delay (Milliseconds 500.0)
                waitForAndClick ".ytSearchboxComponentClearButton" page'
                delay (Milliseconds 500.0)
                T.type_ (T.Selector ".ytSearchboxComponentInput") "Veritasium" {} page'
                delay (Milliseconds 500.0)
                T.click (T.Selector ".ytSearchboxComponentSearchButton") page'
                delay (Milliseconds 500.0)
                let channelLinkSelector = ".channel-link[href^=\"/@veritasium\"]"
                _ <- T.pageWaitForSelector (T.Selector channelLinkSelector) {} page'
                T.click (T.Selector channelLinkSelector) page'
                delay (Milliseconds 500.0)
                waitForAndClick "yt-tab-shape[tab-title=\"Videos\"]" page'
                delay (Milliseconds 500.0)
        )

    if result == true
        then info "ALL TESTS PASSED!"
        else info "UNFORTUNATE FAILURE..."

    -- Shutdown

    T.close browser

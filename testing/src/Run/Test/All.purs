module Run.Test.All (main) where

import Prelude
import Toppokki as T
import Effect.Aff (Aff, delay, launchAff_)
import Lib.Info (info)
import Lib.Helpers (simpleVideosTabTypeSelector, waitForAndClick, waitForClearScreen)
import Data.Time.Duration (Milliseconds(Milliseconds))
import Effect.Class (liftEffect)
import Node.Process (exit') as Process
import Command.Script (browser, setup)
import Data.Either (Either(..))
import Effect (Effect)
import Command.Step (startStep, step)

-- TODO: perhaps it would be useful to have a --show option for tests to disable headless without modification
-- would be best if i had a handler moduler for that
--
-- argv <- Process.argv
-- let args = Array.drop 2 argv  -- drop "node" + script path, keep user args

main :: Effect Unit
main = launchAff_ script

script :: Aff Unit
script = do
    browser' <- browser false
    page' <- setup browser'

    let step' = step page'
    result <- startStep
        >>= step' "videos-latest" "https://www.youtube.com/playlist?list=UULFy0tKL1T7wFoYcxCe0xjN6Q&playnext=1" (
            \page -> do
                T.type_ (T.Selector ".ytSearchboxComponentInput") "Technology Connections" {} page
                delay (Milliseconds 500.0)
                T.click (T.Selector ".ytSearchboxComponentSearchButton") page
                delay (Milliseconds 500.0)
                let channelLinkSelector = ".channel-link[href=\"/@TechnologyConnections\"]"
                _ <- T.pageWaitForSelector (T.Selector channelLinkSelector) {} page
                T.click (T.Selector channelLinkSelector) page
                delay (Milliseconds 500.0)
                waitForAndClick "yt-tab-shape[tab-title=\"Videos\"]" page
                delay (Milliseconds 500.0)
        )
        >>= step' "videos-popular" "https://www.youtube.com/playlist?list=UULPy0tKL1T7wFoYcxCe0xjN6Q&playnext=1" (
            \page -> do
                waitForAndClick btnPopularSelector page
                delay (Milliseconds 500.0)
        )
        >>= step' "videos-latest-2" "https://www.youtube.com/playlist?list=UULFy0tKL1T7wFoYcxCe0xjN6Q&playnext=1" (
            \page -> do
                waitForAndClick btnLatestSelector page
                delay (Milliseconds 500.0)
        )
        >>= step' "videos-popular-2" "https://www.youtube.com/playlist?list=UULPy0tKL1T7wFoYcxCe0xjN6Q&playnext=1" (
            \page -> do
                waitForAndClick btnPopularSelector page
                delay (Milliseconds 500.0)
        )
        >>= step' "videos-latest-3" "https://www.youtube.com/playlist?list=UULFy0tKL1T7wFoYcxCe0xjN6Q&playnext=1" (
            \page -> do
                waitForAndClick btnLatestSelector page
                delay (Milliseconds 500.0)
        )
        >>= step' "videos-popular-3" "https://www.youtube.com/playlist?list=UULPy0tKL1T7wFoYcxCe0xjN6Q&playnext=1" (
            \page -> do
                waitForAndClick btnPopularSelector page
                delay (Milliseconds 500.0)
        )
        >>= step' "reload-videos-latest" "https://www.youtube.com/playlist?list=UULFy0tKL1T7wFoYcxCe0xjN6Q&playnext=1" (
            \page -> do
                waitForClearScreen page
                T.goto (T.URL "https://www.youtube.com/@TechnologyConnections/videos") page
                delay (Milliseconds 500.0)
                _ <- T.pageWaitForSelector (T.Selector "yt-tab-shape[tab-title=\"Videos\"]") {} page
                delay (Milliseconds 500.0)
        )
        >>= step' "reload-videos-popular" "https://www.youtube.com/playlist?list=UULPy0tKL1T7wFoYcxCe0xjN6Q&playnext=1" (
            \page -> do
                waitForAndClick btnPopularSelector page
                delay (Milliseconds 500.0)
        )
        >>= step' "shorts-latest" "https://www.youtube.com/playlist?list=UUSHXnNibvR_YIdyPs8PZIBoEw&playnext=1" (
            \page -> do
                T.type_ (T.Selector ".ytSearchboxComponentInput") "Cathode Ray Dude CRD" {} page
                delay (Milliseconds 500.0)
                T.click (T.Selector ".ytSearchboxComponentSearchButton") page
                delay (Milliseconds 500.0)
                let channelLinkSelector = ".channel-link[href=\"/@CathodeRayDude\"]"
                _ <- T.pageWaitForSelector (T.Selector channelLinkSelector) {} page
                T.click (T.Selector channelLinkSelector) page
                waitForAndClick "yt-tab-shape[tab-title=\"Shorts\"]" page
                delay (Milliseconds 500.0)
        )
        >>= step' "shorts-popular" "https://www.youtube.com/playlist?list=UUPSXnNibvR_YIdyPs8PZIBoEw&playnext=1" (
            \page -> do
                waitForAndClick btnPopularSelector page
                delay (Milliseconds 500.0)
        )
        >>= step' "mythbusters-fallback-videos-latest" "https://www.youtube.com/playlist?list=UULFhUAaNhjdc1aN5f_29BPrhw&playnext=1" (
            \page -> do
                waitForAndClick ".ytSearchboxComponentClearButton" page
                delay (Milliseconds 500.0)
                T.type_ (T.Selector ".ytSearchboxComponentInput") "Mythbusters" {} page
                delay (Milliseconds 500.0)
                T.click (T.Selector ".ytSearchboxComponentSearchButton") page
                delay (Milliseconds 500.0)
                let channelLinkSelector = ".channel-link[href=\"/@Mythbusterstvshow\"]"
                _ <- T.pageWaitForSelector (T.Selector channelLinkSelector) {} page
                T.click (T.Selector channelLinkSelector) page
                delay (Milliseconds 500.0)
                waitForAndClick "yt-tab-shape[tab-title=\"Videos\"]" page
                delay (Milliseconds 500.0)
        )
        >>= step' "mythbusters-fallback-videos-popular" "https://www.youtube.com/playlist?list=UULPhUAaNhjdc1aN5f_29BPrhw&playnext=1" (
            \page -> do
                waitForAndClick btnPopularSelector page
                delay (Milliseconds 500.0)
        )
        >>= step' "mythbusters-fallback-shorts-latest" "https://www.youtube.com/playlist?list=UUSHhUAaNhjdc1aN5f_29BPrhw&playnext=1" (
            \page -> do
                waitForAndClick "yt-tab-shape[tab-title=\"Shorts\"]" page
                delay (Milliseconds 500.0)
        )
        >>= step' "mythbusters-fallback-shorts-popular" "https://www.youtube.com/playlist?list=UUPShUAaNhjdc1aN5f_29BPrhw&playnext=1" (
            \page -> do
                waitForAndClick btnPopularSelector page
                delay (Milliseconds 500.0)
        )
        >>= step' "live-latest" "https://www.youtube.com/playlist?list=UULV5uNya42ayhsRnZOR3mO6NA&playnext=1" (
            \page -> do
                waitForClearScreen page
                T.goto (T.URL "https://www.youtube.com/@Insym/streams") page
                delay (Milliseconds 500.0)
                _ <- T.pageWaitForSelector (T.Selector "yt-tab-shape[tab-title=\"Live\"]") {} page
                delay (Milliseconds 500.0)
        )
        >>= step' "live-popular" "https://www.youtube.com/playlist?list=UUPV5uNya42ayhsRnZOR3mO6NA&playnext=1" (
            \page -> do
                waitForAndClick btnPopularSelector page
                delay (Milliseconds 500.0)
        )
        >>= step' "members-view-videos-latest-implicit" "https://www.youtube.com/playlist?list=UULF7_YxT-KID8kRbqZo7MyscQ&playnext=1" (
            \page -> do
                waitForClearScreen page
                T.goto (T.URL "https://www.youtube.com/@markiplier/videos") page
                delay (Milliseconds 500.0)
                _ <- T.pageWaitForSelector (T.Selector "yt-tab-shape[tab-title=\"Videos\"]") {} page
                delay (Milliseconds 500.0)
        )
        >>= step' "members-view-videos-popular" "https://www.youtube.com/playlist?list=UULP7_YxT-KID8kRbqZo7MyscQ&playnext=1" (
            \page -> do
                waitForAndClick btnDropdownSelector page
                delay (Milliseconds 500.0)
                waitForAndClick btnDropdownMenuPopularSelector page
                delay (Milliseconds 500.0)
        )
        >>= step' "members-view-videos-latest-explicit" "https://www.youtube.com/playlist?list=UULF7_YxT-KID8kRbqZo7MyscQ&playnext=1" (
            \page -> do
                waitForAndClick btnDropdownSelector page
                delay (Milliseconds 500.0)
                waitForAndClick btnDropdownMenuLatestSelector page
                delay (Milliseconds 500.0)
        )

    T.close browser'

    case result of
        Left err -> do
            info "UNFORTUNATE FAILURE..."
            info err
            liftEffect $ Process.exit' 1
        Right _ -> do
            info "ALL TESTS PASSED!"

    where
        btnLatestSelector = simpleVideosTabTypeSelector 1
        btnPopularSelector = simpleVideosTabTypeSelector 2
        btnDropdownSelector = "chip-bar-view-model.ytChipBarViewModelHost div.ytChipBarViewModelChipWrapper:has(.ytIconWrapperHost.ytChipShapeIconEnd)"
        btnDropdownMenuSelector = "tp-yt-iron-dropdown.style-scope.ytd-popup-container:not([hidden], [style*='display: none']) yt-sheet-view-model"
        btnDropdownMenuLatestSelector = btnDropdownMenuSelector <> " yt-list-item-view-model:nth-child(1)"
        btnDropdownMenuPopularSelector = btnDropdownMenuSelector <> " yt-list-item-view-model:nth-child(2)"

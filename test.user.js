// ==UserScript==
// @name            YouTube Play All Test Suite
// @description     Tests YTPA to prevent bugs
// @version         20251111-0
// @author          Robert Wesner (https://robert.wesner.io)
// @license         MIT
// @namespace       http://robert.wesner.io/
// @match           https://*.youtube.com/*
// @icon            https://scripts.yt/favicon.ico
// ==/UserScript==

/**
 * @var {{ defaultPolicy: any, createPolicy: (string, Object) => void }} window.trustedTypes
 */

(function () {
    'use strict';

    if (window.hasOwnProperty('trustedTypes') && !window.trustedTypes.defaultPolicy) {
        window.trustedTypes.createPolicy('default', { createHTML: string => string });
    }

    document.head.insertAdjacentHTML('beforeend', `
        <style>
            #ytpa-test-suite {
                position: fixed;
                right: 2rem;
                bottom: 2rem;
                border-radius: 1rem;
                background: #1b1b1b;
                color: white;
                font-size: 14px;
                padding: 1.6rem;
                z-index: 999999;
                max-width: 30vw;
            }
            
            #ytpa-test-suite .ytpa-test-suite-step[data-completed] + .ytpa-test-suite-step:not([data-completed]),
            #ytpa-test-suite .ytpa-test-suite-step:first-of-type:not([data-completed])
            {
                color: #fcfca1;
            }
            
            .ytpa-test-suite-step[data-completed] {
                color: #c0f5c0 !important;
            }
            
            .ytpa-test-suite-step[data-failed] {
                color: #ff3535 !important;
            }
            
            .ytpa-test-suite-step:not(:last-of-type){
                margin-bottom: 0.64rem;
            }
            
            .ytpa-test-suite-step > div {
                padding-left: 1rem;
                opacity: 0.82;
            }
        </style>
    `);

    /**
     * @param {() => boolean} condition
     * @return {Promise}
     */
    const waitFor = condition => {
        return new Promise(resolve => {
            setTimeout(() => {
                const interval = setInterval(() => {
                    if (!condition()) {
                        return;
                    }

                    setTimeout(() => resolve(), 1000);
                    clearInterval(interval);
                }, 200);
            }, 1000);
        })
    };

    let suite = null;
    const createSuite = () => {
        suite = document.createElement('div');
        suite.id = 'ytpa-test-suite';
        document.body.append(suite);
    };

    const addStep = (id, title, description) => {
        const step = document.createElement('div');
        step.className = 'ytpa-test-suite-step';
        step.setAttribute('data-step', id);

        const stepTitle = document.createElement('strong');
        stepTitle.textContent = title;
        const stepDescription = document.createElement('div');
        stepDescription.innerHTML = description;
        step.append(stepTitle, stepDescription);

        suite.append(step);
    };

    const completeStep = id => {
        const step = suite.querySelector(`[data-step=${id}]`);
        step.setAttribute('data-completed', '');
    };

    const failStep = id => {
        const step = suite.querySelector(`[data-step=${id}]`);
        step.setAttribute('data-failed', '');

        throw 'FAILURE';
    };

    const getButton = () => document.querySelector('.ytpa-btn.ytpa-play-all-btn:not([data-stale])');
    const markButtonAsStale = () => getButton().setAttribute('data-stale', '');

    window.addEventListener('load', () => {
        switch (new URLSearchParams(new URL(window.location.href).search).get('ytpa-test-run')) {
            case 'initial':
                unsafeWindow.YTPATestSuite.test();
                break;
            case 'videos':
                unsafeWindow.YTPATestSuite.testVideosFreshLoad();
                break;
        }
    })

    Object.defineProperty(unsafeWindow, 'YTPATestSuite', {
        configurable: false,
        writable: false,
        value: Object.freeze({
            test: async () => {
                if (document.querySelector('#ytpa-test-suite')) {
                    alert('Tests already running!');
                }
                createSuite();

                addStep('home', '[manually] Homepage', 'Navigate to homepage.');
                addStep('channel', '[manually] @TechnologyConnections', 'Navigate to @TechnologyConnections.');
                addStep('videos', '[manually] Videos', 'Click on <strong>Videos</strong>.');
                addStep('latest', 'Latest Videos', 'Checking for correct URL.');
                addStep('popular', 'Popular Videos', 'Checking for correct URL.');
                addStep('latest-repeat', 'Latest Videos (again)', 'Checking for correct URL.');
                addStep('popular-repeat', 'Popular Videos (again)', 'Checking for correct URL.');
                addStep('refresh', 'Refresh', 'Refreshing page and running more tests.');

                await waitFor(() => window.location.href.endsWith('.youtube.com/'));
                completeStep('home');
                await waitFor(() => window.location.href.endsWith('.youtube.com/@TechnologyConnections'));
                completeStep('channel');
                await waitFor(() => window.location.href.endsWith('.youtube.com/@TechnologyConnections/videos'));
                completeStep('videos');

                await waitFor(() => !!getButton());
                if (getButton().href.endsWith('.youtube.com/playlist?list=UULFy0tKL1T7wFoYcxCe0xjN6Q&playnext=1')) {
                    completeStep('latest');
                    markButtonAsStale();
                } else {
                    failStep('latest');
                }

                document.querySelector('#primary #chips > :nth-child(2), #filter-chip-bar > div > :nth-child(2)').click();
                await waitFor(() => !!getButton());
                if (getButton().href.endsWith('.youtube.com/playlist?list=UULPy0tKL1T7wFoYcxCe0xjN6Q&playnext=1')) {
                    completeStep('popular');
                    markButtonAsStale();
                } else {
                    failStep('popular');
                }

                document.querySelector('#primary #chips > :nth-child(1), #filter-chip-bar > div > :nth-child(1)').click();
                await waitFor(() => !!getButton());
                if (getButton().href.endsWith('.youtube.com/playlist?list=UULFy0tKL1T7wFoYcxCe0xjN6Q&playnext=1')) {
                    completeStep('latest-repeat');
                    markButtonAsStale();
                } else {
                    failStep('latest-repeat');
                }

                document.querySelector('#primary #chips > :nth-child(2), #filter-chip-bar > div > :nth-child(2)').click();
                await waitFor(() => !!getButton());
                if (getButton().href.endsWith('.youtube.com/playlist?list=UULPy0tKL1T7wFoYcxCe0xjN6Q&playnext=1')) {
                    completeStep('popular-repeat');
                    markButtonAsStale();
                } else {
                    failStep('popular-repeat');
                }

                document.querySelector('#primary #chips > :nth-child(1), #filter-chip-bar > div > :nth-child(1)').click();
                await waitFor(() => !!getButton());

                window.location.href = '/@TechnologyConnections/videos?ytpa-test-run=videos'
            },
            testVideosFreshLoad: async () => {
                if (document.querySelector('#ytpa-test-suite')) {
                    alert('Tests already running!');
                }
                createSuite();

                addStep('latest', 'Latest Videos', 'Checking for correct URL.');
                addStep('popular', 'Popular Videos', 'Checking for correct URL.');
                addStep('latest-repeat', 'Latest Videos (again)', 'Checking for correct URL.');
                addStep('popular-repeat', 'Popular Videos (again)', 'Checking for correct URL.');
                addStep('success', 'Success', 'All done!');

                await waitFor(() => !!getButton());
                if (getButton().href.endsWith('.youtube.com/playlist?list=UULFy0tKL1T7wFoYcxCe0xjN6Q&playnext=1')) {
                    completeStep('latest');
                    markButtonAsStale();
                } else {
                    failStep('latest');
                }

                document.querySelector('#primary #chips > :nth-child(2), #filter-chip-bar > div > :nth-child(2)').click();
                await waitFor(() => !!getButton());
                if (getButton().href.endsWith('.youtube.com/playlist?list=UULPy0tKL1T7wFoYcxCe0xjN6Q&playnext=1')) {
                    completeStep('popular');
                    markButtonAsStale();
                } else {
                    failStep('popular');
                }

                document.querySelector('#primary #chips > :nth-child(1), #filter-chip-bar > div > :nth-child(1)').click();
                await waitFor(() => !!getButton());
                if (getButton().href.endsWith('.youtube.com/playlist?list=UULFy0tKL1T7wFoYcxCe0xjN6Q&playnext=1')) {
                    completeStep('latest-repeat');
                    markButtonAsStale();
                } else {
                    failStep('latest-repeat');
                }

                document.querySelector('#primary #chips > :nth-child(2), #filter-chip-bar > div > :nth-child(2)').click();
                await waitFor(() => !!getButton());
                if (getButton().href.endsWith('.youtube.com/playlist?list=UULPy0tKL1T7wFoYcxCe0xjN6Q&playnext=1')) {
                    completeStep('popular-repeat');
                    markButtonAsStale();
                } else {
                    failStep('popular-repeat');
                }

                document.querySelector('#primary #chips > :nth-child(1), #filter-chip-bar > div > :nth-child(1)').click();
                await waitFor(() => !!getButton());
                completeStep('success');
                alert('All tests passed!');
                suite.remove();
            },
        }),
    });
})();

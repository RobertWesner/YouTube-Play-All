#!/bin/bash

echo -e "\e[0;36mSetting up..."
(
    cd linting
    mkdir -p results
    npm ci
    python -m venv .venv
    source .venv/bin/activate
    pip install semgrep
    deactivate
) > /dev/null 2>&1

echo -e "\e[0;36mRunning eslint..."
(
    cd linting
    npm run lint -- --output-file results/eslint.out || echo "error" >> results/eslint.out
)  > /dev/null 2>&1

echo -e "\e[0;36mRunning semgrep..."
(
    cd linting
    source .venv/bin/activate
    semgrep -c ../.semgrep.yml ../script.user.js --output results/semgrep.out || echo "error" >> results/semgrep.out
    deactivate
)  > /dev/null 2>&1

echo -e "\e[0;36mReporting..."
(
    cd linting
    function check() {
        if [ -e "results/$1" ] && [ ! -s "results/$1" ]; then
            echo -e "    \e[0;32mPASSED"
        elif [ ! -e "results/$1" ]; then
            echo -e "    \e[0;33mNO RESULT"
        else
            echo -e "    \e[0;31mFAILED!"
            echo -e "    \e[0;31mRead report with: cat linting/results/$1"
        fi
    }

    echo -e "  \e[0;35mChecking report for eslint..."
    check eslint.out

    echo -e "  \e[0;35mChecking report for semgrep..."
    check semgrep.out
)

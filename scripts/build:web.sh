#!/bin/bash

expo build:web
web_build_return_code="$?"

echo "lite.sushiswap.fi" > web-build/CNAME

exit "${web_build_return_code}"

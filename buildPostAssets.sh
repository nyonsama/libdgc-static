#!/usr/bin/env bash

for post in `ls posts`;do
    if [ -e "posts/$post/build.sh" ];then
        pushd "posts/$post"
        bash ./build.sh
        popd
    fi
done

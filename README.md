# DockerVM

## How to build:

Run the following in your terminal:

```docker build -t jarvis/dockervm $(pwd)```

## How to run:

Run the following in the terminal of your choice:
```docker run -it --rm -v "/var/run/docker.sock:/var/run/docker.sock" jarvis/dockervm```

To run it with a more reloadable approach, run this in your development folder:
```
docker run -it --rm -v "$(pwd)/index.js:/app/index.js" -v "$(pwd)/public:/app/public" -v "/var/run/docker.sock:/var/run/docker.sock" -p "8085:8085" -p "9229:9229" jarvis/dockervm
```

[![Build Status](https://app.travis-ci.com/thallosaurus/DockerVM.svg?branch=main)](https://app.travis-ci.com/thallosaurus/DockerVM)
####################################################################################################################################
# Build stage 1 - Create a distribution of the project which we can copy in the second build stage.
####################################################################################################################################
FROM rod_catch_returns/builder AS builder
WORKDIR /app

# Install app dependencies
COPY / /app
RUN npm install --ignore-scripts && npm cache clean --force > /dev/null 2>&1

####################################################################################################################################
# Build stage 2 - Using the distribution from stage 1, build the final docker image with a minimal number of layers.
####################################################################################################################################
FROM rod_catch_returns/base
WORKDIR /app
COPY --from=builder /app/ /app/

# Default service port
ARG PORT=5000

EXPOSE ${PORT}
ENTRYPOINT [ "pm2-runtime", "ecosystem.config.yml" ]

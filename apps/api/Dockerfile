FROM node:22

# Install pnpm directly without Corepack
RUN npm install -g npm@latest && npm install -g pnpm@latest-10

ARG user=app
ARG gid=1000
ARG uid=1000

RUN deluser --remove-home node

RUN groupadd -g $gid ${user}
RUN useradd -m -u $uid -g ${user} ${user}

# Create and set permissions for working directory
RUN mkdir -p /usr/share/${user} && chown -R ${user}:${user} /usr/share/${user}

# Don't switch user yet - let setup.sh handle it
# USER ${user}

WORKDIR /usr/share/${user}  

COPY --chown=${user}:${user} . .

ENTRYPOINT ./setup.sh
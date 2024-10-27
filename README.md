# OrangeCal

OrangeCal is a Discord bot designed to manage reminders and notifications within a Discord server.

## Features

-   Register and deregister commands dynamically
-   Handle user interactions with commands and buttons
-   Manage reminder notifications using queues

## Getting Started

### Prerequisites

-   Node.js
-   pnpm

### Installation

1. Clone the repository:

    ```sh
    git clone <repository-url>
    cd orange-cal
    ```

2. Install dependencies:

    ```sh
    pnpm install
    ```

3. Create a `.env` file and add your configuration:
    ```env
    DISCORD_TOKEN=your-discord-token
    CLIENT_ID=your-client-id
    REDIS_HOST=your-redis-host
    REDIS_PORT=your-redis-port
    ```

### Running the Bot

To start the bot in development mode:

```sh
pnpm dev
```

To start the bot in production mode:

```sh
pnpm build
pnpm start
```

To lint the code:

```sh
pnpm lint
```

To format the code:

```sh
pnpm prettier
```

## Contributing

Feel free to open issues or submit pull requests for any improvements or bug fixes.

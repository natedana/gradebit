# puddle-jumper

Low-side data upload and management

## Install Development Dependencies

These instructions are for Mac. Other platforms will differ.

Install [Docker](https://download.docker.com/mac/stable/Docker.dmg).

Install Homebrew.

```console
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

Install development tools using Homebrew:

```console
brew install node yarn git bash-completion
```

## Running the Django Server

Build the images locally:

```console
docker-compose build
```

Initialize the database:

```console
docker-compose run --rm puddlejumper python manage.py migrate
```

Start the containers:

```console
docker-compose up
```

## Running the UI in Browser

Install client dependecies:

```console
yarn install
```

Build the client bundles:

```console
yarn build
```

Alternatively, if you are doing active development you can run the following command in a different terminal window to have webpack automatically update the client whenever a relevant change is made:

```console
yarn watch
```

With the docker containers running, navigate to [localhost](http://localhost) in your browser of choice to view the UI.

## Running tests

You will need to set the `PJ_LOCKOUT_DISABLED` since the mock logins do not pass the request which is required by the Axes backend. 

```console
docker-compose run -e PJ_LOCKOUT_DISABLED='' --rm puddlejumper python manage.py test 
```

## Environment Variables

These are the environment variables that can be set for the application:

### General

| Variable | Description |
| -------- | ----------- |
| DJANGO_DEBUG | Turns on debug mode |
| DJANGO_ALLOWED_HOSTS | Sets the host names Django will allow in production mode |
| DJANGO_SETTINGS_MODULE | Filepath to the django settings configuration file |
| UPLOAD_LOCATION | The filepath scheme and location to save uploaded files to |
| AWS_ACCESS_KEY_ID | Self-explantory |
| AWS_SECRET_ACCESS_KEY | Self-explanatory |
| PJ_LOCKOUT_DISABLED | Should only be used for testing purposes. Disable login lockout functionality |

### Database

| Variable | Description |
| -------- | ----------- |
| POSTGRES_NAME | Database name |
| POSTGRES_HOST | Database host |
| POSTGRES_PORT | Database port |
| POSTGRES_USER | Database username |
| POSTGRES_PASSWORD | Database password |

### Email

| Variable | Description |
| -------- | ----------- |
| EMAIL_HOST | SMTP host |
| EMAIL_PORT | SMTP port |
| EMAIL_USE_TLS | Use TLS for SMTP connection |
| EMAIL_HOST_USER | Username for SMTP connection |
| EMAIL_HOST_PASSWORD | Password for SMTP connection |
| EMAIL_ADMIN_LIST | List of admins to set notification emails to |
| EMAIL_SENDER | The email address to send the email from |

## Developer Environment

We recommend using [Visual Studio Code](https://code.visualstudio.com/) for your development. It has great integration with our linting tools. Suggested plugins are listed in [extensions.json](.vscode/extensions.json). Of note are the linters TSLint and ESLint. We currently use both because neither one alone fully fits our needs for Typescript linting.

You can configure the extension settings from the `Code` application menu --> `Preferences` --> `Settings`.  Once the tab opens in the IDE, click the on `{}` icon in the top right of the settings tab window.  This will open a `User Settings` tab where you can paste the following json on the right half of the window:

We recommend the following VSCode settings for these linters:

```json
"eslint.autoFixOnSave": true,
"eslint.validate": [
    "javascript",
    "javascriptreact",
    { "language": "typescript", "autoFix": true },
    { "language": "typescriptreact", "autoFix": true }
],
"tslint.enable": true,
"tslint.autoFixOnSave": true,
```

In Visual Studio Code, be mindful of which code language versions the IDE is using.  This is displayed along the bottom status bar.  There is potential for the IDE language version to not match the project version (Python and Typescript).  You can click on the version number to see other path options to switch to.

## Python Setup
The [Django server](#running-the-django-server) step will create a Docker container with the required Python environment setup. The container will pick up changes to the server and you can start an interactive session (`exec -it`) into it to use the Python interpreter. In addition, you can create a virutal environment to skip the step or allow your IDE to pick up the required packages. 

```bash
# This will create the virutal environment at the path <ENV_PATH> so make sure it doesn't exist or is an empty directory
python3 -m venv <ENV_PATH>
source <ENV_PATH>/bin/activate
pip install -r requirements.txt
pip install pylint
```

To run make sure the server side code is properly running please run the command `pylint server/`

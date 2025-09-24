http://aws-practitioner-js-bucket-v1.s3-website-us-east-1.amazonaws.com/



$ aws configure list-profiles
default
DeveloperBase-971217900852
cloudx-js
971217900852_DeveloperBase


$ aws sts get-caller-identity --profile cloudx-js
An error occurred (InvalidClientTokenId) when calling the GetCallerIdentity operation: The security token included in the request is invalid.



Як виправити

Переконатися, що профіль є в ~/.aws/credentials:

[cloudx-js]
aws_access_key_id = AKIAxxxxxxxxxxxxx
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYxxxxxxxx
region = us-east-1


Якщо не впевнений у ключах → створи нові:

Зайди в AWS Console → IAM → Users → твій юзер → Security credentials.

Створи новий Access key.

Пропиши його в профіль:

aws configure --profile cloudx-js


і введи:

AWS Access Key ID [None]: ...
AWS Secret Access Key [None]: ...
Default region name [None]: us-east-1
Default output format [None]: json


Перевір знову:

aws sts get-caller-identity --profile cloudx-js


Якщо все ок → покаже Account, UserId, Arn.

------------------
Альтернатива (якщо ти на SSO / тимчасових ключах)

Якщо компанія дала SSO-доступ (AzureAD видно в твоєму prompt 🧐), то замість постійних ключів треба:

aws sso login --profile cloudx-js


і тоді aws sts get-caller-identity --profile cloudx-js має спрацювати.



------------
AzureAD+LiubomyrKozak@EPUALVIW09D5 MINGW64 ~/Workspace/EPAM/shop-react-redux-cloudfront/infra (feature/task-module-2)
$ aws sso login --profile cloudx-js

Missing the following required SSO configuration values: sso_start_url, sso_region. To make sure this profile is properly configured to use SSO, please run: aws configure sso




Access key
If you lose or forget your secret access key, you cannot retrieve it. Instead, create a new access key and make the old key inactive.

Access key
Secret access key

AKIAV7KJJZ6V43BGDFJV

nHEJ6xCrpTweqyF+WcWX9tM+MOsVMMVS7m6jANmT
Hide




current credentials could not be used to assume 'arn:aws:iam::410859982763:role/cdk-hnb659fds-deploy-role-410859982763-us-east-2', but are for the right account. Proceeding anyway.
DeployWebAppStack: SSM parameter /cdk-bootstrap/hnb659fds/version not found. Has the environment been bootstrapped? Please run 'cdk bootstrap' (see https://docs.aws.amazon.com/cdk/latest/guide/bootstrapping.html)

AzureAD+LiubomyrKozak@EPUALVIW09D5 MINGW64 ~/Workspace/EPAM/shop-react-redux-cloudfront/infra (feature/task-module-2)
$ cdk bootstrap aws://410859982763/us-east-1 --profile cloudx-js



Це означає, що AWS CDK ще не “запустив” (bootstrapped) твоє середовище.
CDK bootstrap створює в AWS ресурси, потрібні для деплою:

S3 bucket для assets (JS/CSS файли)

IAM roles (cdk-hnb659fds-deploy-role-...)

SSM parameter /cdk-bootstrap/.../version

Без цього деплой не працює.

🔹 Як виправити

Запусти bootstrap для твого акаунта та регіону:

cdk bootstrap aws://410859982763/us-east-1 --profile cloudx-js


Після успішного завершення буде створено всі потрібні ресурси.

Потім можна робити деплой:

cdk deploy --profile cloudx-js
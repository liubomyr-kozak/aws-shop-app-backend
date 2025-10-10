#!/usr/bin/env bash
# Створює CDK bootstrap та деплоїть усі стеки в одному регіоні.
ACCOUNT="410859982763"
PROFILE="cloudx-js"
REGION="us-east-1"
QUALIFIER="hnb659fds"  # залиш як є, якщо у CDK за замовчуванням

set -e

echo "==> Bootstrapping $ACCOUNT / $REGION"
cdk bootstrap "aws://$ACCOUNT/$REGION" \
  --profile "$PROFILE" \
  --region "$REGION" \
  --qualifier "$QUALIFIER" \
  --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess

echo "==> Deploying all stacks"
cdk deploy --all --profile "$PROFILE" --region "$REGION"

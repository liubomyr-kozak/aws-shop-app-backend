#!/usr/bin/env bash
# Видаляє CDK-стеки (DeployWebAppStack, ProductServiceStack), чистить S3-бакети (включно з версіями),
# прибирає bootstrap (CDKToolkit + asset buckets), та видаляє "ручні" Lambda/LogGroup.

ACCOUNT="410859982763"      # ← заміни, якщо треба
PROFILE="cloudx-js"         # ← твій AWS CLI профіль
REGIONS=("us-east-1" "us-east-2")
STACKS=("DeployWebAppStack" "ProductServiceStack")

set -u  # не падаємо на помилках команд, щоб дійти до кінця
trap 'echo "Done (with best effort)."' EXIT

purge_bucket() {
  local BUCKET="$1"
  local REGION="$2"
  local PROFILE="$3"

  [ -z "$BUCKET" ] && return 0

  echo "===> Purging bucket: $BUCKET (region $REGION)"
  aws s3 rm "s3://$BUCKET" --recursive --region "$REGION" --profile "$PROFILE" >/dev/null 2>&1 || true

  # Видаляємо всі версії
  VERS_FILE="$(mktemp)"
  aws s3api list-object-versions --bucket "$BUCKET" \
    --region "$REGION" --profile "$PROFILE" \
    --query '{Objects: (Versions||`[]`)[].{Key:Key,VersionId:VersionId}, Quiet: `true`}' \
    > "$VERS_FILE" 2>/dev/null || echo '{"Objects":[],"Quiet":true}' > "$VERS_FILE"
  aws s3api delete-objects --bucket "$BUCKET" --delete "file://$VERS_FILE" \
    --region "$REGION" --profile "$PROFILE" >/dev/null 2>&1 || true

  # Видаляємо delete-markers
  DM_FILE="$(mktemp)"
  aws s3api list-object-versions --bucket "$BUCKET" \
    --region "$REGION" --profile "$PROFILE" \
    --query '{Objects: (DeleteMarkers||`[]`)[].{Key:Key,VersionId:VersionId}, Quiet: `true`}' \
    > "$DM_FILE" 2>/dev/null || echo '{"Objects":[],"Quiet":true}' > "$DM_FILE"
  aws s3api delete-objects --bucket "$BUCKET" --delete "file://$DM_FILE" \
    --region "$REGION" --profile "$PROFILE" >/dev/null 2>&1 || true

  rm -f "$VERS_FILE" "$DM_FILE"

  # Фінальне видалення бакета
  aws s3 rb "s3://$BUCKET" --force --region "$REGION" --profile "$PROFILE" >/dev/null 2>&1 || true
}

for R in "${REGIONS[@]}"; do
  echo "================ REGION: $R ================"

  # 1) Спробуємо цивільно знести всі CDK-стеки цього регіону
  cdk destroy --all --force --region "$R" --profile "$PROFILE" >/dev/null 2>&1 || true

  # 2) Для кожного відомого стека — знайдемо S3 бакети й вичистимо їх (часта причина DELETE_FAILED)
  for S in "${STACKS[@]}"; do
    echo "-- stack: $S"
    # Список бакетів, які створив стек (як CloudFormation-ресурси)
    BUCKETS=$(
      aws cloudformation list-stack-resources \
        --stack-name "$S" --region "$R" --profile "$PROFILE" \
        --query 'StackResourceSummaries[?ResourceType==`AWS::S3::Bucket`].PhysicalResourceId' \
        --output text 2>/dev/null || echo ""
    )
    # Вичищаємо кожен знайдений бакет
    if [ -n "$BUCKETS" ]; then
      echo "$BUCKETS" | tr '\t' '\n' | while read -r B; do
        [ -z "$B" ] && continue
        purge_bucket "$B" "$R" "$PROFILE"
      done
    fi

    # Спробуємо видалити стек ще раз, і почекаємо завершення
    aws cloudformation delete-stack --stack-name "$S" --region "$R" --profile "$PROFILE" >/dev/null 2>&1 || true
    aws cloudformation wait stack-delete-complete --stack-name "$S" --region "$R" --profile "$PROFILE" >/dev/null 2>&1 || true
  done

  # 3) Видалимо CDK asset buckets (за замовчуванням qualifier hnb659fds) та інші варіанти
  #    Шукаємо будь-які бакети формату cdk-*-assets-<ACCOUNT>-<REGION>
  ALL_CDK_ASSET_BUCKETS=$(
    aws s3api list-buckets --profile "$PROFILE" \
      --query "Buckets[?starts_with(Name, 'cdk-') && ends_with(Name, '-assets-$ACCOUNT-$R')].Name" \
      --output text 2>/dev/null || echo ""
  )
  if [ -n "$ALL_CDK_ASSET_BUCKETS" ]; then
    echo "$ALL_CDK_ASSET_BUCKETS" | tr '\t' '\n' | while read -r B; do
      [ -z "$B" ] && continue
      purge_bucket "$B" "$R" "$PROFILE"
    done
  fi

  # 4) Видаляємо стек бутстрапу CDKToolkit
  aws cloudformation delete-stack --stack-name CDKToolkit --region "$R" --profile "$PROFILE" >/dev/null 2>&1 || true
  aws cloudformation wait stack-delete-complete --stack-name CDKToolkit --region "$R" --profile "$PROFILE" >/dev/null 2>&1 || true

  # 5) Приберемо можливі "ручні" Lambda + їх LogGroup (якщо колись створювались поза CDK)
  for FN in getProductsList getProductsById createProduct deleteProduct; do
    aws lambda delete-function --function-name "$FN" --region "$R" --profile "$PROFILE" >/dev/null 2>&1 || true
    aws logs delete-log-group --log-group-name "/aws/lambda/$FN" --region "$R" --profile "$PROFILE" >/dev/null 2>&1 || true
  done

  # 6) Також видалимо Lambda/логи з префіксом імені стека (якщо ти перейменовував функції через префікс)
  LAMBDAS=$(
    aws lambda list-functions --region "$R" --profile "$PROFILE" \
      --query "Functions[?starts_with(FunctionName, 'ProductServiceStack-')].FunctionName" \
      --output text 2>/dev/null || echo ""
  )
  if [ -n "$LAMBDAS" ]; then
    echo "$LAMBDAS" | tr '\t' '\n' | while read -r FN; do
      [ -z "$FN" ] && continue
      aws lambda delete-function --function-name "$FN" --region "$R" --profile "$PROFILE" >/dev/null 2>&1 || true
      aws logs delete-log-group --log-group-name "/aws/lambda/$FN" --region "$R" --profile "$PROFILE" >/dev/null 2>&1 || true
    done
  fi
done

echo "All cleanup steps attempted."

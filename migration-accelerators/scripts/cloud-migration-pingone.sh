#!/bin/sh
###################################################################
#
# This script helps to manage the deployment of resources into a
# a destination (i.e. PingOne or Ping AIC).
#
#   https://library.pingidentity.com/page/cloud-migration
#
# The script is bundled with a set of terraform plans that can be
# used to deploy resources into a PingOne instance.
#
# Copyright © 2025 Ping Identity Corporation
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
###################################################################
TMP_DIR=$(mktemp -d) &&
    SCRIPT_VERSION="1.5.0" &&
    TERRAFORM_DIR="terraform" &&
    TERRAFORM="terraform -chdir=${TERRAFORM_DIR}"

cleanup() { rm -rf "${TMP_DIR}"; }
trap cleanup EXIT
error() {
    echo
    echo "ERROR: ${1}"
    echo
    exit 1
}
check_command() {
    command -v "$1" 1> /dev/null 2> /dev/null
    if [ $? -ne 0 ]; then
        error "$1 command not found. Please install '$1'."
    fi
}

check_command terraform
check_command jq
check_command tr
check_command printf
check_command cat
check_command mktemp

# Function to Display Terraform Details
display_terraform_details() {
    echo "###########################################"
    echo "#  Terraform Details                      #"
    echo "###########################################"

    cat "${TERRAFORM_DIR}/pingone_application.tf.json" | jq -r '[
  "  Applications: \(.resource.pingone_application | length)"
] | .[]'
    cat "${TERRAFORM_DIR}/pingone_key.tf.json" | jq -r '[
  " Signing Certs: \(.resource.pingone_key | length)"
] | .[]'

}

# Function to Display PingOne Environment
display_pingone_environment() {
    echo "###########################################"
    echo "#  PingOne Environment                    #"
    echo "###########################################"

    PINGONE_URL=$(echo 'local.pingone_auth_url' | ${TERRAFORM} console | tr -d '"')

    cat "${TERRAFORM_DIR}/locals.tf.json" | jq -r --arg pingoneUrl "$PINGONE_URL" '[
  "             PingOne URL: " + $pingoneUrl
] | .[]'
    cat "${TERRAFORM_DIR}/variable.tf.json" | jq -r --arg pingoneUrl "$PINGONE_URL" '[
  "          Environment ID: \(.variable.pingone_environment_id.default)",
  "               Client ID: \(.variable.pingone_client_id.default)"
] | .[]'

}

# Function to perform a terraform init on the terraform directory
terraform_init() {
    ${TERRAFORM} init
}

# Function to perform a terraform plan on the terraform directory
terraform_plan() {
    ${TERRAFORM} plan
}

# Function to perform a terraform apply on the terraform directory
terraform_apply() {
    ${TERRAFORM} apply -auto-approve
}

# Function to perform a terraform destroy on the terraform directory
terraform_destroy() {
    ${TERRAFORM} destroy
}

# Function to display the top menu
top_menu() {
    clear
    echo "##############################################################"
    echo "#  Cloud Migration Tool (v ${SCRIPT_VERSION})                            #"
    echo "##############################################################"
    echo "#  1. Display Terraform Details                              #"
    echo "#  2. Display PingOne Environment                            #"
    echo "#                                                            #"
    echo "#  3. Initialize terraform provider      > terraform init    #"
    echo "#  4. Check PingOne against plan         > terraform plan    #"
    echo "#  5. Apply changes to PingOne           > terraform apply   #"
    echo "#  6. Cleanup PingOne from any changes   > terraform destroy #"
    echo "#                                                            #"
    echo "#  Q: Quit                                                   #"
    echo "##############################################################"
}

# Functio to execute the command based on top menu
execute_choice() {
    case $1 in
        1)
            display_terraform_details
            ;;
        2)
            display_pingone_environment
            ;;
        3)
            terraform_init
            ;;
        4)
            terraform_plan
            ;;
        5)
            terraform_apply
            ;;
        6)
            terraform_destroy
            ;;
        Q | q)
            exit
            ;;
        *)
            echo "Invalid option"
            ;;
    esac
}

# cd ${TERRAFORM_DIR}
${TERRAFORM} init > /dev/null

# Main Loop
while true; do
    top_menu
    printf "\nEnter your choice: "
    read choice
    echo ""
    execute_choice $choice
    echo ""
    printf "Press Enter to continue..."
    read _dummy
    clear
done

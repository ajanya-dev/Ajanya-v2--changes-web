# Dynamic form

The dynamic form is a common component used in scenarios where it is expected that
the form will need to be updated frequently in order to remain relevant(Or in case forms rendered based on API rsponses).

## Config

'dynamic-form' component is added to shared module. Just import shared module to your current module to use the component.
 
## Usage
Form Config options
--------------------
1.cssClasses : string
    scss classes for form group goes here.
    eg:-
    "cssClasses": "grid grid-cols-4 gap-4",

2.inputControls : IDynamicInputControl[]
    Array of input controls
    
    Type - IDynamicInputControl{
                id: number; // input id - assigned in html to the input element as `formControl_${id}`
                type: string; // Input Control Type
                label: string; // Label for input OR header for radio-group and checkbox-group
                cssClasses?: string; //css class assigned to parent <div></div> of input
                name: string; // formcontrol name
                validators: IDynamicFormValidators; //Validators
                options?: any[] | ICheckBoxOption[]; // Options for radio group , select etc.
                optionValue?: string; // Option value for radio group , select etc.
                optionLabel?: string; // Option label for radio group , select etc.
                value?:string; //Default value of control
            }

Input Control Types and eg. with supported sibling properties
-----------------------------------------------------
"type" : "text" | "password" | "select" | "radio" | "mat-radio-group" | "checkbox" | "checkbox-group" | "date" | "textarea" | "header";


⁘ text | password
   eg:- {
            "id": 1,
            "type": "text",
            "label": "Bank Name",
            "cssClasses": "col-span-2",
            "name": "bankName",
            "validators": {
                "required": true,
                "minLength": 1
            },
            value:""
        }

⁘ select | mat-radio-group 
    eg:- {
            "id": 5,
            "type": "mat-radio-group",
            "label": "Account Type",
            "name": "accountType",
            "cssClasses": "col-span-2",
            "validators": {
                "required": true
            },
            "options": [
                {
                    "name": "Current",
                    "value": "current"
                },
                {
                    "name": "Checking",
                    "value": "checking"
                },
                {
                    "name": "Savings",
                    "value": "savings"
                }
            ],
            "optionLabel": "name",
            "optionValue": "value",
            "value": "savings"
        }

⁘ checkbox | radio 
    eg:- {
            "id": 9,
            "type": "checkbox",
            "label": "Enable Feature",
            "name": "enableFeature",
            "cssClasses": "col-span-2",
            "value" : "true",
            "validators": {}
        }

⁘ checkbox-group
    eg:- {
            "id": 5,
            "type": "checkbox-group",
            "label": "Account Type",
            "name": "accountType2",
            "cssClasses": "col-span-2",
            "validators": {
                "required": true
            },
            "options": [
                {
                    "id": 12,
                    "name": "current",
                    "value": false
                },
                {
                    "id": 13,
                    "name": "checking",
                    "value": false
                },
                {
                    "id": 14,
                    "name": "savings",
                    "value": true
                }
            ],
            "optionLabel": "name",
            "optionValue": "value",
        },


Supported Validators
---------------------
IDynamicFormValidators{
    min?:number;
    max?:number;
    required?:boolean;
    requiredTrue?:boolean;
    email?:boolean;
    minLength?:number;
    maxLength?:number;
    pattern?:string;
    nullValidator?:boolean;
    routingNumberValidator?:boolean;
    routingNumberValidatorAPI?:boolean; // calls api and checks US Routing Number
  }


## Functions
1. setValidationMessage(controlName:string, message:string):void

    sets custom valitation message for special validations




## SAMPLE 

in HTML
--------
 <app-dynamic-form [formConfig]="formConfig" (formReady)="onFormReady($event)"></app-dynamic-form>

in TS
--------
    dynamicForm:FormGroup;
    formFunctions:IDynamicFormfunctions;

    formConfig:IDynamicFormConfig ={ 
        "cssClasses": "grid grid-cols-4 gap-4",
        "inputControls": [{
                "id": 1,
                "type": "text",
                "label": "Bank Name",
                "cssClasses": "col-span-2",
                "name": "bankName",
                "validators": {
                    "required": true,
                    "minLength": 1
                }
            },
            {
                "id": 6,
                "type": "select",
                "label": "Account Holder Type",
                "name": "holderType",
                "validators": {
                    "required": true
                },
                "options": [
                    {
                        "name": "Personal",
                        "value": "personal"
                    },
                    {
                        "name": "Company",
                        "value": "company"
                    }
                ],
                "optionValue": "value",
                "optionLabel": "name",
                "value": "personal"
            }]
    }

  onFormReady(event:IDynamicFormReadyResponse){
    this.formFunctions = event.componentFunctions;
    this.dynamicForm = event.dynamicForm;
  }

## Contributing
For major changes, please discuss what you would like to change to Frontent Team Lead.

(⌐■v■) END
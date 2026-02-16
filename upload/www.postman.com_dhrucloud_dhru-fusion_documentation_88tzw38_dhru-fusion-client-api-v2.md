# DHRU FUSION CLIENT API v2 | Documentation

## Introduction

This documents for Dhru Fusion client side API.

## Authentication

Required API Key to make call this api.

### POST[Get Account Info](https://www.postman.com/dhrucloud/dhru-fusion/request/q4zncqw/get-account-info)

https://{{APIURL}}/api/index.php

Return :

    {

        "SUCCESS": [

            {

                "message": "Your Accout Info",

                "AccoutInfo": {

                    "credit": "$61,195.601 ",

                    "creditraw": "61195.601",

                    "mail": "demo@demo.com",

                    "currency": "USD"

                }

            }

        ],

        "apiversion": "5.2"

    }

### POST[Get All Services and Groups](https://www.postman.com/dhrucloud/dhru-fusion/request/vknw6b7/get-all-services-and-groups)

https://{{APIURL}}/api/index.php

This endpoint return all service and groups include IMEI and Server and Remote

    Identify Group types by key GROUPTYPE = [IMEI,SERVER,REMOTE]

    Identify Service types by key SERVICETYPE = [IMEI,SERVER,REMOTE]

Return :

    {

      "SUCCESS": [

        {

          "MESSAGE": "IMEI Service List",

          "LIST": {

            "Server Group A": {

              "GROUPNAME": "Server Group A",

              "GROUPTYPE": "SERVER",

              "SERVICES": {

                "6484": {

                  "SERVICEID": 1,

                  "SERVICETYPE": "SERVER",

                  "QNT": "0",

                  "SERVER": "1",

                  "MINQNT": "0",

                  "MAXQNT": "0",

                  "CUSTOM": {

                    "allow": "0",

                    "bulk": "0",

                    "customname": "",

                    "custominfo": "",

                    "customlen": "0",

                    "maxlength": "0",

                    "regex": "",

                    "isalpha": "0"

                  },

                  "SERVICENAME": "Server Service",

                  "CREDIT": 1.25,

                  "TIME": " Miniutes",

                  "INFO": "This is test service one",

                  "Requires.Network": "None",

                  "Requires.Mobile": "None",

                  "Requires.Provider": "None",

                  "Requires.PIN": "None",

                  "Requires.KBH": "None",

                  "Requires.MEP": "None",

                  "Requires.PRD": "None",

                  "Requires.Type": "None",

                  "Requires.Locks": "None",

                  "Requires.Reference": "None",

                  "Requires.SN": "None",

                  "Requires.SecRO": "None",

                  "Requires.Custom": [

                    {

                      "type": "serviceimei",

                      "fieldname": "SERIAL_NUMBER",

                      "fieldtype": "text",

                      "description": "",

                      "fieldoptions": "",

                      "regexpr": "",

                      "adminonly": "",

                      "required": "on",

                      "enc": ""

                    }

                  ]

                }

              }

            }

          }

        }

      ]

    }

### POST[Get File Services](https://www.postman.com/dhrucloud/dhru-fusion/request/rj6swbb/get-file-services)

http://{{APIURL}}/api/index.php

RETURN :

    {

      "SUCCESS": [

        {

          "MESSAGE": "File Service List",

          "LIST": {

            "A&amp;D": {

              "GROUPNAME": "File Service Group",

              "SERVICES": {

                "1": {

                  "SERVICEID": 14,

                  "SERVICENAME": "File Service one",

                  "CREDIT": 1,

                  "TIME": " Minutes",

                  "ALLOW_EXTENSION": "jpeg,txt,pdf,csv,xlxs",

                  "INFO": ""

                }

              }

            }

          }

        }

      ],

      "apiversion": "5.2"

    }

### POST[Place Single Order](https://www.postman.com/dhrucloud/dhru-fusion/request/bsn2frs/place-single-order)

https://{{APIURL}}/api/index.php

RETURN :

    {

      "SUCCESS": [

        {

          "MESSAGE": "Order received",

          "REFERENCEID": "10101010"

        }

      ],

      "apiversion": "5.2"

    }

Bodyform-data

parameters

<PARAMETERS><IMEI>111111111111119</IMEI><ID>58361</ID><CUSTOMFIELD>eyJTRVJJQUxfTlVNQkVSIiA6ICJTRVJJQUwgTlVNQkVSIn0=</CUSTOMFIELD></PARAMETERS>

REQUIRED if service type = IMEI:  IMEI - 15 Digit  ID - Service ID

    REQUIRED if service type = SERVER:
        ID - Service ID

    OPTIONAL - depends on service needs if is required
        QNT
        MODELID
        PROVIDERID
        MEP
        PIN
        KBH
        PRD
        TYPE
        REFERENCE
        LOCKS
        SN
        SecRO
        CUSTOMFIELD - json string encode with base64 e.g. base64_encode({"SERIAL_NUMBER" : "SERIAL NUMBER"})

### POST[Place Bulk Order for IMEI Service](https://www.postman.com/dhrucloud/dhru-fusion/request/x9ajv3u/place-bulk-order-for-imei-service)

https://{{APIURL}}/api/index.php

RETURN :

With multiple results whatever order ids requested.

    {

        "0": {

            "ERROR": [

                {

                    "MESSAGE": "",

                    "FULL_DESCRIPTION": ""

                }

            ]

        },

        "1": {

            "SUCCESS": [

                {

                    "MESSAGE": "Order received",

                    "REFERENCEID": "10101010"

                }

            ]

        },

        "apiversion": "5.2"

    }

Bodyform-data

parameters

W3siSU1FSSI6IjExMTExMTExMTExMTExOSIsIklEIjoiNTE0MTMifSx7IklNRUkiOiIyMjIyMjIyMjIyMjIyMjkiLCJJRCI6IjUxNDEzIn1d

Json string with base64 encoded

e.g base64_encode('[{"IMEI":"111111111111119","ID":123123},{"IMEI":"222222222222229","ID":123123}]')

REQUIRED if service type = IMEI:  IMEI - 15 Digit  ID - Service ID

    OPTIONAL - depends on service needs if is required
        QNT
        MODELID
        PROVIDERID
        MEP
        PIN
        KBH
        PRD
        TYPE
        REFERENCE
        LOCKS
        SN
        SecRO
        CUSTOMFIELD - json string encode with base64 e.g. base64_encode({"SERIAL_NUMBER" : "SERIAL NUMBER"})
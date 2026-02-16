# API Integration | Dhru Help Center

**URL:** https://help.dhru.com/en/articles/10892898-api-integration

---

Skip to main content
Dhru Help Center
English
English
Search for articles...
Connecting to Other DHRU Servers
Becoming an API Server (API Listener)
All Collections
Dhru fusion
Developer Tools
API Integration
API Integration
d
Written by dhru soft
Updated over 11 months ago

DHRU FUSION provides a robust and well-documented API that allows you to connect with other DHRU FUSION servers, automate tasks, and integrate with third-party systems.

 

You can either connect to another DHRU server as a client, or build your own API listener, so other DHRU users can connect to your server as a service provider.

 

 

Connecting to Other DHRU Servers

Using the built-in API, you can:

• Place IMEI/Service orders

• Fetch product/service lists

• Check order statuses

• Retrieve account balance

• Manage client data and funds

 

Start with the API Documentation

 

Refer to the inbuilt documentation in your DHRU admin panel or official API documentation for detailed instructions and command parameters.

 

 

Run in Postman

 

You can use the Postman API collection to test and explore API endpoints interactively.

 

🔹 Click “Run in Postman”

Import the collection and set up your API credentials to start sending requests.

 

 

PHP Example

 

To help you get started quickly, a PHP-based sample API client is available:

 

📁 Download: api.zip

 

The package includes:

• Sample API request scripts

• Authentication flow

• Common use cases (order, balance, status)

• Error handling examples

 

 

Becoming an API Server (API Listener)

If you want other DHRU users to connect to your platform as their service provider, you can build your own API listener.

 

This allows you to:

• Accept incoming API requests from other DHRU FUSION clients

• Process orders and return replies via API

• Act as a supplier with automated fulfillment

 

API Listener Standards

 

To ensure compatibility, follow the official open-source API listener standards:

 

🔗 https://github.com/dhru/dhru-fusion-api-standards

 

This includes:

• Required endpoints and request/response formats

• Status code standards

• Example implementations in PHP

Did this answer your question?
😞😐😃
Dhru Help Center
We run on Intercom
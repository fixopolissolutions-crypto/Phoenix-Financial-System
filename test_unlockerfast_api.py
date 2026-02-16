#!/usr/bin/env python3
"""
Script para probar la API de UnlockerFast (Dhru Fusion)
"""

import requests
import json

# Credenciales
API_KEY = "6T0-V56-CPP-IGB-K0Q-54F-9TL-1WB"
USERNAME = "UnlockVeneUsa"
BASE_URL = "https://www.unlockerfast.com.mx"

# Posibles endpoints de API según estándares de Dhru Fusion
api_endpoints = [
    f"{BASE_URL}/api",
    f"{BASE_URL}/api/v2",
    f"{BASE_URL}/api.php",
    f"{BASE_URL}/includes/api.php",
]

print("=" * 60)
print("Probando API de UnlockerFast (Dhru Fusion)")
print("=" * 60)

# Probar cada endpoint posible
for endpoint in api_endpoints:
    print(f"\n🔍 Probando endpoint: {endpoint}")
    
    # Intentar con diferentes métodos de autenticación
    auth_methods = [
        {"headers": {"X-API-KEY": API_KEY}},
        {"params": {"api_key": API_KEY}},
        {"params": {"key": API_KEY}},
        {"params": {"username": USERNAME, "api_key": API_KEY}},
    ]
    
    for i, auth in enumerate(auth_methods, 1):
        try:
            print(f"  Método {i}: {list(auth.keys())[0]}")
            response = requests.get(endpoint, timeout=10, **auth)
            print(f"    Status: {response.status_code}")
            
            if response.status_code == 200:
                print(f"    ✅ Respuesta exitosa!")
                print(f"    Content-Type: {response.headers.get('Content-Type')}")
                print(f"    Response (primeros 500 chars):")
                print(f"    {response.text[:500]}")
                
                # Intentar parsear como JSON
                try:
                    data = response.json()
                    print(f"    📄 JSON Response:")
                    print(f"    {json.dumps(data, indent=2)[:500]}")
                except:
                    pass
            elif response.status_code == 404:
                print(f"    ❌ Endpoint no encontrado")
            else:
                print(f"    ⚠️  Status code: {response.status_code}")
                print(f"    Response: {response.text[:200]}")
        except requests.exceptions.Timeout:
            print(f"    ⏱️  Timeout")
        except requests.exceptions.ConnectionError:
            print(f"    🔌 Error de conexión")
        except Exception as e:
            print(f"    ❌ Error: {str(e)[:100]}")

print("\n" + "=" * 60)
print("Prueba completada")
print("=" * 60)

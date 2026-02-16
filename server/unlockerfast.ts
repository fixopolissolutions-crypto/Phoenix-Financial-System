/**
 * Integración con UnlockerFast API (Dhru Fusion)
 * Documentación: https://www.postman.com/dhrucloud/dhru-fusion/documentation/88tzw38/dhru-fusion-client-api-v2
 */

const API_URL = 'https://www.unlockerfast.com.mx/api/index.php';
const USERNAME = 'UnlockVeneUsa';
const API_KEY = '6T0-V56-CPP-IGB-K0Q-54F-9TL-1WB';

interface UnlockerFastResponse {
  SUCCESS?: any[];
  ERROR?: any[];
  apiversion?: string;
}

/**
 * Realizar una petición a la API de UnlockerFast
 */
async function apiRequest(action: string, additionalParams: Record<string, any> = {}): Promise<UnlockerFastResponse> {
  const params = new URLSearchParams({
    username: USERNAME,
    apiaccesskey: API_KEY,
    action,
    ...additionalParams
  });

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[UnlockerFast API] Error:', error);
    throw error;
  }
}

/**
 * Obtener información de la cuenta
 */
export async function getAccountInfo() {
  const response = await apiRequest('accountinfo');
  
  if (response.SUCCESS && response.SUCCESS.length > 0) {
    return response.SUCCESS[0].AccoutInfo;
  }
  
  throw new Error('Failed to get account info');
}

/**
 * Obtener lista de todos los servicios disponibles
 */
export async function getAllServices() {
  const response = await apiRequest('getservicelist');
  
  if (response.SUCCESS && response.SUCCESS.length > 0) {
    const servicesList = response.SUCCESS[0].LIST;
    const services: any[] = [];
    
    // Parsear la estructura de grupos y servicios
    for (const groupName in servicesList) {
      const group = servicesList[groupName];
      const groupType = group.GROUPTYPE;
      
      if (group.SERVICES) {
        for (const serviceKey in group.SERVICES) {
          const service = group.SERVICES[serviceKey];
          services.push({
            ...service,
            GROUPNAME: groupName,
            GROUPTYPE: groupType
          });
        }
      }
    }
    
    return services;
  }
  
  throw new Error('Failed to get services list');
}

/**
 * Crear un pedido simple
 */
export async function placeOrder(params: {
  serviceId: string;
  imei?: string;
  customFields?: Record<string, any>;
}) {
  let parametersXML = `<PARAMETERS><ID>${params.serviceId}</ID>`;
  
  if (params.imei) {
    parametersXML += `<IMEI>${params.imei}</IMEI>`;
  }
  
  if (params.customFields) {
    const customFieldsJSON = JSON.stringify(params.customFields);
    const customFieldsBase64 = Buffer.from(customFieldsJSON).toString('base64');
    parametersXML += `<CUSTOMFIELD>${customFieldsBase64}</CUSTOMFIELD>`;
  }
  
  parametersXML += `</PARAMETERS>`;
  
  const response = await apiRequest('placeorder', {
    parameters: parametersXML
  });
  
  if (response.SUCCESS && response.SUCCESS.length > 0) {
    return {
      message: response.SUCCESS[0].MESSAGE,
      referenceId: response.SUCCESS[0].REFERENCEID
    };
  }
  
  if (response.ERROR && response.ERROR.length > 0) {
    throw new Error(response.ERROR[0].MESSAGE || 'Failed to place order');
  }
  
  throw new Error('Failed to place order');
}

/**
 * Obtener información de un pedido
 */
export async function getOrderInfo(referenceId: string) {
  const response = await apiRequest('getorderinfo', {
    referenceid: referenceId
  });
  
  if (response.SUCCESS && response.SUCCESS.length > 0) {
    return response.SUCCESS[0];
  }
  
  if (response.ERROR && response.ERROR.length > 0) {
    throw new Error(response.ERROR[0].MESSAGE || 'Failed to get order info');
  }
  
  throw new Error('Failed to get order info');
}

/**
 * Crear múltiples pedidos (bulk)
 */
export async function placeBulkOrder(orders: Array<{
  serviceId: string;
  imei?: string;
  customFields?: Record<string, any>;
}>) {
  const ordersArray = orders.map(order => ({
    ID: order.serviceId,
    ...(order.imei && { IMEI: order.imei }),
    ...(order.customFields && { 
      CUSTOMFIELD: Buffer.from(JSON.stringify(order.customFields)).toString('base64')
    })
  }));
  
  const parametersBase64 = Buffer.from(JSON.stringify(ordersArray)).toString('base64');
  
  const response = await apiRequest('placebulkorder', {
    parameters: parametersBase64
  });
  
  return response;
}

/**
 * Obtener servicios de archivos
 */
export async function getFileServices() {
  const response = await apiRequest('getfileservices');
  
  if (response.SUCCESS && response.SUCCESS.length > 0) {
    return response.SUCCESS[0].LIST;
  }
  
  throw new Error('Failed to get file services');
}

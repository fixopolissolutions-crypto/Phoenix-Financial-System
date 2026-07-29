/**
 * Página temporal de importación masiva de pantallas RPX
 * Solo visible para admin. Acceder a /seed-parts para ejecutar.
 */
import { useState } from "react";
import { trpc } from '@/lib/trpc';

const RPX_PARTS = [
  // ==================== iPHONE - LCD (Aftermarket Plus FHD) ====================
  { codigo: "PART-IP8SE-LCD", nombre: "Pantalla iPhone 8 / SE 2020/2022 - LCD Aftermarket Plus FHD (Blanco)", categoria: "Pantallas iPhone", compatibilidad: "iPhone 8, iPhone SE 2020, iPhone SE 2022", precioCompraUnitario: "14.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP8P-LCD-W", nombre: "Pantalla iPhone 8 Plus - LCD Aftermarket Plus FHD (Blanco)", categoria: "Pantallas iPhone", compatibilidad: "iPhone 8 Plus", precioCompraUnitario: "15.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP8P-LCD-B", nombre: "Pantalla iPhone 8 Plus - LCD Aftermarket Plus FHD (Negro)", categoria: "Pantallas iPhone", compatibilidad: "iPhone 8 Plus", precioCompraUnitario: "15.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IPXR-LCD", nombre: "Pantalla iPhone XR - LCD Aftermarket Plus FHD", categoria: "Pantallas iPhone", compatibilidad: "iPhone XR", precioCompraUnitario: "16.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IPX-LCD", nombre: "Pantalla iPhone X - LCD Aftermarket Plus FHD", categoria: "Pantallas iPhone", compatibilidad: "iPhone X", precioCompraUnitario: "15.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IPXS-LCD", nombre: "Pantalla iPhone XS - LCD Aftermarket Plus FHD", categoria: "Pantallas iPhone", compatibilidad: "iPhone XS", precioCompraUnitario: "15.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IPXSMAX-LCD", nombre: "Pantalla iPhone XS Max - LCD Aftermarket Plus FHD", categoria: "Pantallas iPhone", compatibilidad: "iPhone XS Max", precioCompraUnitario: "17.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP11-LCD", nombre: "Pantalla iPhone 11 - LCD Aftermarket Plus FHD", categoria: "Pantallas iPhone", compatibilidad: "iPhone 11", precioCompraUnitario: "15.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP11P-LCD", nombre: "Pantalla iPhone 11 Pro - LCD Aftermarket Plus FHD", categoria: "Pantallas iPhone", compatibilidad: "iPhone 11 Pro", precioCompraUnitario: "16.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP11PM-LCD", nombre: "Pantalla iPhone 11 Pro Max - LCD Aftermarket Plus FHD", categoria: "Pantallas iPhone", compatibilidad: "iPhone 11 Pro Max", precioCompraUnitario: "17.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP12-LCD", nombre: "Pantalla iPhone 12 / 12 Pro - LCD Aftermarket Plus FHD", categoria: "Pantallas iPhone", compatibilidad: "iPhone 12, iPhone 12 Pro", precioCompraUnitario: "17.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP12PM-LCD", nombre: "Pantalla iPhone 12 Pro Max - LCD Aftermarket Plus FHD", categoria: "Pantallas iPhone", compatibilidad: "iPhone 12 Pro Max", precioCompraUnitario: "23.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP12MINI-LCD", nombre: "Pantalla iPhone 12 Mini - LCD Aftermarket Plus FHD", categoria: "Pantallas iPhone", compatibilidad: "iPhone 12 Mini", precioCompraUnitario: "20.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP13-LCD", nombre: "Pantalla iPhone 13 - LCD Aftermarket Plus FHD", categoria: "Pantallas iPhone", compatibilidad: "iPhone 13", precioCompraUnitario: "23.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP13MINI-LCD", nombre: "Pantalla iPhone 13 Mini - LCD Aftermarket Plus FHD", categoria: "Pantallas iPhone", compatibilidad: "iPhone 13 Mini", precioCompraUnitario: "20.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP13P-LCD", nombre: "Pantalla iPhone 13 Pro - LCD Aftermarket Plus FHD", categoria: "Pantallas iPhone", compatibilidad: "iPhone 13 Pro", precioCompraUnitario: "28.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP13PM-LCD", nombre: "Pantalla iPhone 13 Pro Max - LCD Aftermarket Plus FHD", categoria: "Pantallas iPhone", compatibilidad: "iPhone 13 Pro Max", precioCompraUnitario: "30.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP14-LCD", nombre: "Pantalla iPhone 14 - LCD Aftermarket Plus FHD", categoria: "Pantallas iPhone", compatibilidad: "iPhone 14", precioCompraUnitario: "22.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP14P-LCD", nombre: "Pantalla iPhone 14 Pro - LCD Aftermarket Plus FHD", categoria: "Pantallas iPhone", compatibilidad: "iPhone 14 Pro", precioCompraUnitario: "30.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP14PM-LCD", nombre: "Pantalla iPhone 14 Pro Max - LCD Aftermarket Plus FHD", categoria: "Pantallas iPhone", compatibilidad: "iPhone 14 Pro Max", precioCompraUnitario: "33.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP14PLUS-LCD", nombre: "Pantalla iPhone 14 Plus - LCD Aftermarket Plus FHD", categoria: "Pantallas iPhone", compatibilidad: "iPhone 14 Plus", precioCompraUnitario: "27.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP15-LCD", nombre: "Pantalla iPhone 15 - LCD Aftermarket Plus FHD", categoria: "Pantallas iPhone", compatibilidad: "iPhone 15", precioCompraUnitario: "26.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP15P-LCD", nombre: "Pantalla iPhone 15 Pro - LCD Aftermarket Plus FHD", categoria: "Pantallas iPhone", compatibilidad: "iPhone 15 Pro", precioCompraUnitario: "30.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP15PM-LCD", nombre: "Pantalla iPhone 15 Pro Max - LCD Aftermarket Plus FHD", categoria: "Pantallas iPhone", compatibilidad: "iPhone 15 Pro Max", precioCompraUnitario: "35.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP15PLUS-LCD", nombre: "Pantalla iPhone 15 Plus - LCD Aftermarket Plus FHD", categoria: "Pantallas iPhone", compatibilidad: "iPhone 15 Plus", precioCompraUnitario: "30.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP16-LCD", nombre: "Pantalla iPhone 16 - LCD Aftermarket Plus FHD", categoria: "Pantallas iPhone", compatibilidad: "iPhone 16", precioCompraUnitario: "28.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP16P-LCD", nombre: "Pantalla iPhone 16 Pro - LCD Aftermarket Plus FHD", categoria: "Pantallas iPhone", compatibilidad: "iPhone 16 Pro", precioCompraUnitario: "43.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP16PM-LCD", nombre: "Pantalla iPhone 16 Pro Max - LCD Aftermarket Plus FHD", categoria: "Pantallas iPhone", compatibilidad: "iPhone 16 Pro Max", precioCompraUnitario: "45.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP16E-LCD", nombre: "Pantalla iPhone 16e / 17E - LCD Aftermarket Plus FHD", categoria: "Pantallas iPhone", compatibilidad: "iPhone 16e, iPhone 17E", precioCompraUnitario: "30.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP16PLUS-LCD", nombre: "Pantalla iPhone 16 Plus - LCD Aftermarket Plus FHD", categoria: "Pantallas iPhone", compatibilidad: "iPhone 16 Plus", precioCompraUnitario: "35.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP17-LCD", nombre: "Pantalla iPhone 17 - LCD Aftermarket Plus FHD", categoria: "Pantallas iPhone", compatibilidad: "iPhone 17", precioCompraUnitario: "55.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP17P-LCD", nombre: "Pantalla iPhone 17 Pro - LCD Aftermarket Plus FHD", categoria: "Pantallas iPhone", compatibilidad: "iPhone 17 Pro", precioCompraUnitario: "55.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP17PM-LCD", nombre: "Pantalla iPhone 17 Pro Max - LCD Aftermarket Plus FHD", categoria: "Pantallas iPhone", compatibilidad: "iPhone 17 Pro Max", precioCompraUnitario: "55.00", cantidadInicial: 0, stockMinimo: 2 },

  // ==================== iPHONE - SOFT OLED (RPX Soft OLED) ====================
  { codigo: "PART-IP13-OLED", nombre: "Pantalla iPhone 13 - SOFT OLED RPX (120Hz / 1:1 Original)", categoria: "Pantallas iPhone", compatibilidad: "iPhone 13", precioCompraUnitario: "48.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP13P-OLED", nombre: "Pantalla iPhone 13 Pro - SOFT OLED RPX (120Hz / 1:1 Original)", categoria: "Pantallas iPhone", compatibilidad: "iPhone 13 Pro", precioCompraUnitario: "53.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP13PM-OLED", nombre: "Pantalla iPhone 13 Pro Max - SOFT OLED RPX (120Hz / 1:1 Original)", categoria: "Pantallas iPhone", compatibilidad: "iPhone 13 Pro Max", precioCompraUnitario: "45.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP14-OLED", nombre: "Pantalla iPhone 14 - SOFT OLED RPX (120Hz / 1:1 Original)", categoria: "Pantallas iPhone", compatibilidad: "iPhone 14", precioCompraUnitario: "48.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP14P-OLED", nombre: "Pantalla iPhone 14 Pro - SOFT OLED RPX (120Hz / 1:1 Original)", categoria: "Pantallas iPhone", compatibilidad: "iPhone 14 Pro", precioCompraUnitario: "60.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP14PM-OLED", nombre: "Pantalla iPhone 14 Pro Max - SOFT OLED RPX (120Hz / 1:1 Original)", categoria: "Pantallas iPhone", compatibilidad: "iPhone 14 Pro Max", precioCompraUnitario: "55.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP14PLUS-OLED", nombre: "Pantalla iPhone 14 Plus - SOFT OLED RPX (120Hz / 1:1 Original)", categoria: "Pantallas iPhone", compatibilidad: "iPhone 14 Plus", precioCompraUnitario: "46.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP15-OLED", nombre: "Pantalla iPhone 15 - SOFT OLED RPX (120Hz / 1:1 Original)", categoria: "Pantallas iPhone", compatibilidad: "iPhone 15", precioCompraUnitario: "50.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP15P-OLED", nombre: "Pantalla iPhone 15 Pro - SOFT OLED RPX (120Hz / 1:1 Original)", categoria: "Pantallas iPhone", compatibilidad: "iPhone 15 Pro", precioCompraUnitario: "60.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP15PM-OLED", nombre: "Pantalla iPhone 15 Pro Max - SOFT OLED RPX (120Hz / 1:1 Original)", categoria: "Pantallas iPhone", compatibilidad: "iPhone 15 Pro Max", precioCompraUnitario: "60.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP15PLUS-OLED", nombre: "Pantalla iPhone 15 Plus - SOFT OLED RPX (120Hz / 1:1 Original)", categoria: "Pantallas iPhone", compatibilidad: "iPhone 15 Plus", precioCompraUnitario: "60.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP16-OLED", nombre: "Pantalla iPhone 16 - SOFT OLED RPX (120Hz / 1:1 Original)", categoria: "Pantallas iPhone", compatibilidad: "iPhone 16", precioCompraUnitario: "50.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP16P-OLED", nombre: "Pantalla iPhone 16 Pro - SOFT OLED RPX (120Hz / 1:1 Original)", categoria: "Pantallas iPhone", compatibilidad: "iPhone 16 Pro", precioCompraUnitario: "77.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP16PM-OLED", nombre: "Pantalla iPhone 16 Pro Max - SOFT OLED RPX (120Hz / 1:1 Original)", categoria: "Pantallas iPhone", compatibilidad: "iPhone 16 Pro Max", precioCompraUnitario: "77.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP16PLUS-OLED", nombre: "Pantalla iPhone 16 Plus - SOFT OLED RPX (120Hz / 1:1 Original)", categoria: "Pantallas iPhone", compatibilidad: "iPhone 16 Plus", precioCompraUnitario: "56.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP17-OLED", nombre: "Pantalla iPhone 17 - SOFT OLED RPX (120Hz / 1:1 Original)", categoria: "Pantallas iPhone", compatibilidad: "iPhone 17", precioCompraUnitario: "87.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP17P-OLED", nombre: "Pantalla iPhone 17 Pro - SOFT OLED RPX (120Hz / 1:1 Original)", categoria: "Pantallas iPhone", compatibilidad: "iPhone 17 Pro", precioCompraUnitario: "95.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-IP17PM-OLED", nombre: "Pantalla iPhone 17 Pro Max - SOFT OLED RPX (120Hz / 1:1 Original)", categoria: "Pantallas iPhone", compatibilidad: "iPhone 17 Pro Max", precioCompraUnitario: "128.00", cantidadInicial: 0, stockMinimo: 2 },

  // ==================== SAMSUNG - LCD OEM ====================
  { codigo: "PART-SMA03-LCD", nombre: "Pantalla Samsung Galaxy A03 / A035 - LCD Original OEM con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A03 (A035/2021)", precioCompraUnitario: "14.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-SMA02S-LCD", nombre: "Pantalla Samsung Galaxy A02S / A025 / A027 - LCD Original OEM con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A02S (A025), A027", precioCompraUnitario: "14.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-SMA03S-LCD", nombre: "Pantalla Samsung Galaxy A03S / A037 - LCD Original OEM con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A03S (A037F/A037G/2021)", precioCompraUnitario: "14.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-SMA03SU-LCD", nombre: "Pantalla Samsung Galaxy A03S / A037U - LCD Original OEM con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A03S (A037U)", precioCompraUnitario: "14.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-SMA04-LCD", nombre: "Pantalla Samsung Galaxy A04 / A045 - LCD Original OEM con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A04 (A045/2022)", precioCompraUnitario: "14.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-SMA04S-LCD", nombre: "Pantalla Samsung Galaxy A04S / A047 - LCD Original OEM con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A04S (A047/2022)", precioCompraUnitario: "14.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-SMA12-LCD", nombre: "Pantalla Samsung Galaxy A12 / A125 / A127 - LCD Original OEM con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A12 (A125/A127)", precioCompraUnitario: "14.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-SMA13-LCD", nombre: "Pantalla Samsung Galaxy A13 4G / A135F - LCD Original OEM con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A13 4G (A135F/A137)", precioCompraUnitario: "14.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-SMA13NF-LCD", nombre: "Pantalla Samsung Galaxy A13 4G / A136 2021 - LCD Original OEM sin Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A13 4G (A135/M336)", precioCompraUnitario: "14.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-SMA135G-LCD", nombre: "Pantalla Samsung Galaxy A13 5G / A137 2022 - LCD Original OEM con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A13 5G (A13 2022)", precioCompraUnitario: "14.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-SMA144G-LCD", nombre: "Pantalla Samsung Galaxy A14 4G / A145 - LCD Original OEM con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A14 4G (A145P/A145R/2023)", precioCompraUnitario: "14.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-SMA145G-LCD", nombre: "Pantalla Samsung Galaxy A14 5G / A146 - LCD Original OEM con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A14 5G (A145F/A145R/2023, A146B/2023)", precioCompraUnitario: "16.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-SMA145GU-LCD", nombre: "Pantalla Samsung Galaxy A14 5G / A146U / A146P - LCD Original OEM con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A14 5G (A146U/A146P)", precioCompraUnitario: "16.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-SMA22-LCD", nombre: "Pantalla Samsung Galaxy A22 5G / A226 - LCD Original OEM con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A22 5G (A226)", precioCompraUnitario: "16.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-SMA23-LCD", nombre: "Pantalla Samsung Galaxy A23 5G / A236 - LCD Original OEM con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A23 5G (A236)", precioCompraUnitario: "17.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-SMA32-LCD", nombre: "Pantalla Samsung Galaxy A32 5G / A326 - LCD Original OEM con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A32 5G (A326)", precioCompraUnitario: "15.00", cantidadInicial: 0, stockMinimo: 2 },

  // ==================== SAMSUNG - INCELL ====================
  { codigo: "PART-SMA15-INCELL", nombre: "Pantalla Samsung Galaxy A15 5G / A156 - INCELL con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A15 5G/4G (A155/A156)", precioCompraUnitario: "17.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-SMA16-INCELL", nombre: "Pantalla Samsung Galaxy A16 5G / A166 - INCELL con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A16 5G (A166)", precioCompraUnitario: "15.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-SMA30A50-INCELL", nombre: "Pantalla Samsung Galaxy A30 / A50 - INCELL con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A30/A50 (A305/A505)", precioCompraUnitario: "15.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-SMA33-INCELL", nombre: "Pantalla Samsung Galaxy A33 5G / A336 - INCELL con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A33 5G (A336)", precioCompraUnitario: "18.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-SMA34-INCELL", nombre: "Pantalla Samsung Galaxy A34 5G / A346 - INCELL con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A34 5G (A346)", precioCompraUnitario: "18.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-SMA35-INCELL", nombre: "Pantalla Samsung Galaxy A35 5G / A356 - INCELL con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A35 5G (A356)", precioCompraUnitario: "18.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-SMA36-INCELL", nombre: "Pantalla Samsung Galaxy A36 5G / A366 - INCELL con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A36 5G (A366)", precioCompraUnitario: "24.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-SMA70-INCELL", nombre: "Pantalla Samsung Galaxy A70 / A705 - INCELL con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A70 (A705)", precioCompraUnitario: "18.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-SMA72-INCELL", nombre: "Pantalla Samsung Galaxy A72 5G / A726 - INCELL con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A72 5G (A726)", precioCompraUnitario: "19.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-SMA52-INCELL", nombre: "Pantalla Samsung Galaxy A52 / A52S 5G - INCELL con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A52/A52S 5G (A525/A527)", precioCompraUnitario: "19.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-SMA53-INCELL", nombre: "Pantalla Samsung Galaxy A53 5G / A536 - INCELL con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A53 5G (A536)", precioCompraUnitario: "20.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-SMA54-INCELL", nombre: "Pantalla Samsung Galaxy A54 5G / A546 - INCELL con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A54 5G (A546)", precioCompraUnitario: "22.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-SMA55-INCELL", nombre: "Pantalla Samsung Galaxy A55 5G / A556 - INCELL con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A55 5G (A556)", precioCompraUnitario: "23.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-SMA56-INCELL", nombre: "Pantalla Samsung Galaxy A56 5G / A566 - INCELL con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A56 5G (A566)", precioCompraUnitario: "26.00", cantidadInicial: 0, stockMinimo: 2 },

  // ==================== SAMSUNG - OLED ====================
  { codigo: "PART-SMA15-OLED", nombre: "Pantalla Samsung Galaxy A15 5G / A156 - OLED con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A15 5G/4G (A155/A156)", precioCompraUnitario: "32.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-SMA16-OLED", nombre: "Pantalla Samsung Galaxy A16 5G / A166 - OLED con Marco", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy A16 5G (A166)", precioCompraUnitario: "35.00", cantidadInicial: 0, stockMinimo: 2 },
  { codigo: "PART-SMS21U-OLED", nombre: "Pantalla Samsung Galaxy S21 Ultra - OLED Plus con Marco (US Version)", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy S21 Ultra (US Version)", precioCompraUnitario: "75.00", cantidadInicial: 0, stockMinimo: 1 },
  { codigo: "PART-SMS22U-OLED", nombre: "Pantalla Samsung Galaxy S22 Ultra - OLED Plus con Marco (US Version)", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy S22 Ultra (US Version)", precioCompraUnitario: "75.00", cantidadInicial: 0, stockMinimo: 1 },
  { codigo: "PART-SMS24U-OLED", nombre: "Pantalla Samsung Galaxy S24 Ultra - OLED Plus con Marco (US Version)", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy S24 Ultra (US Version)", precioCompraUnitario: "95.00", cantidadInicial: 0, stockMinimo: 1 },
  { codigo: "PART-SMS25U-OLED", nombre: "Pantalla Samsung Galaxy S25 Ultra - OLED Plus con Marco (US Version)", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy S25 Ultra (US Version)", precioCompraUnitario: "100.00", cantidadInicial: 0, stockMinimo: 1 },
  { codigo: "PART-SMS25-OLED", nombre: "Pantalla Samsung Galaxy S25 - OLED Plus con Marco (US Version)", categoria: "Pantallas Samsung", compatibilidad: "Samsung Galaxy S25 (US Version)", precioCompraUnitario: "120.00", cantidadInicial: 0, stockMinimo: 1 },
];

export default function SeedInventoryParts() {
  const [status, setStatus] = useState<string>("");
  const [done, setDone] = useState(false);
  const bulkImport = trpc.inventoryParts.bulkImport.useMutation();

  const handleImport = async () => {
    setStatus("Importando productos... por favor espera.");
    try {
      const result = await bulkImport.mutateAsync(RPX_PARTS);
      setStatus(
        `✅ Importación completada:\n• ${result.created} productos creados\n• ${result.skipped} ya existían (omitidos)\n• ${result.errors.length} errores${result.errors.length > 0 ? ":\n" + result.errors.join("\n") : ""}`
      );
      setDone(true);
    } catch (err: any) {
      setStatus(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <div className="bg-gray-800 rounded-xl p-8 max-w-lg w-full text-center">
        <h1 className="text-2xl font-bold mb-2">Importar Pantallas RPX</h1>
        <p className="text-gray-400 mb-6 text-sm">
          Se importarán <strong className="text-orange-400">{RPX_PARTS.length} productos</strong> al inventario de partes (iPhone + Samsung).
          Los productos que ya existan serán omitidos automáticamente.
        </p>
        {!done && (
          <button
            onClick={handleImport}
            disabled={bulkImport.isLoading}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
          >
            {bulkImport.isLoading ? "Importando..." : "Importar Ahora"}
          </button>
        )}
        {status && (
          <pre className="mt-6 text-left bg-gray-900 rounded-lg p-4 text-sm text-green-400 whitespace-pre-wrap">
            {status}
          </pre>
        )}
      </div>
    </div>
  );
}

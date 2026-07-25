import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { FileText, Download, Calendar, TrendingUp, Building2, Store, BarChart3, DollarSign, Landmark, Receipt, PiggyBank, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Reportes() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [generatingReport, setGeneratingReport] = useState(false);

  // Query para obtener todas las transacciones
  const { data: transacciones = [], isLoading } = trpc.transactions.list.useQuery({});

  // Query para obtener configuración
  const { data: configData = {} } = trpc.config.getAll.useQuery();

  // Query para obtener nómina de la última semana
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const { data: payrollData = [] } = trpc.payroll.list.useQuery({
    fechaInicio: oneWeekAgo.toISOString().split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0],
  });

  // Query para obtener empleados
  const { data: empleados = [] } = trpc.employees.list.useQuery();

  const data = useMemo(() => {
    const config = {
      taxRate: parseFloat(configData.taxRate || '8.25'),
      porcentajeAhorro: parseFloat(configData.porcentajeAhorro || '30'),
      porcentajeInversion: parseFloat(configData.porcentajeInversion || '20'),
      porcentajeEmergencia: parseFloat(configData.porcentajeEmergencia || '10'),
      porcentajeDisponible: parseFloat(configData.porcentajeDisponible || '40'),
    };

    // Filtrar transacciones de la última semana
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyTransactions = transacciones.filter(t => {
      const fecha = new Date(t.fecha);
      return fecha >= oneWeekAgo;
    });

    // Separar por tienda
    const adminTransactions = weeklyTransactions.filter(t => t.tienda === 'admin');
    const sucursalTransactions = weeklyTransactions.filter(t => t.tienda === 'sucursal');

    // Calcular datos por método de pago para Admin
    const adminEfectivo = adminTransactions.filter(t => t.tipo === 'ingreso' && t.metodo === 'efectivo').reduce((sum, t) => sum + parseFloat(t.monto), 0);
    const adminBanco = adminTransactions.filter(t => t.tipo === 'ingreso' && t.metodo === 'banco').reduce((sum, t) => sum + parseFloat(t.monto), 0);
    const adminGastosEfectivo = adminTransactions.filter(t => t.tipo === 'gasto' && t.metodo === 'efectivo').reduce((sum, t) => sum + parseFloat(t.monto), 0);
    const adminGastosBanco = adminTransactions.filter(t => t.tipo === 'gasto' && t.metodo === 'banco').reduce((sum, t) => sum + parseFloat(t.monto), 0);

    // Calcular nómina por tienda y método
    const adminPayroll = payrollData.filter(p => p.tienda === 'admin');
    const adminNominaEfectivo = adminPayroll.filter(p => p.metodo === 'efectivo').reduce((sum, p) => sum + parseFloat(p.monto), 0);
    const adminNominaBanco = adminPayroll.filter(p => p.metodo === 'banco').reduce((sum, p) => sum + parseFloat(p.monto), 0);
    const adminNominaTotal = adminNominaEfectivo + adminNominaBanco;

    // Calcular datos por método de pago para Sucursal
    const sucursalEfectivo = sucursalTransactions.filter(t => t.tipo === 'ingreso' && t.metodo === 'efectivo').reduce((sum, t) => sum + parseFloat(t.monto), 0);
    const sucursalBanco = sucursalTransactions.filter(t => t.tipo === 'ingreso' && t.metodo === 'banco').reduce((sum, t) => sum + parseFloat(t.monto), 0);
    const sucursalGastosEfectivo = sucursalTransactions.filter(t => t.tipo === 'gasto' && t.metodo === 'efectivo').reduce((sum, t) => sum + parseFloat(t.monto), 0);
    const sucursalGastosBanco = sucursalTransactions.filter(t => t.tipo === 'gasto' && t.metodo === 'banco').reduce((sum, t) => sum + parseFloat(t.monto), 0);

    // Calcular nómina para Sucursal
    const sucursalPayroll = payrollData.filter(p => p.tienda === 'sucursal');
    const sucursalNominaEfectivo = sucursalPayroll.filter(p => p.metodo === 'efectivo').reduce((sum, p) => sum + parseFloat(p.monto), 0);
    const sucursalNominaBanco = sucursalPayroll.filter(p => p.metodo === 'banco').reduce((sum, p) => sum + parseFloat(p.monto), 0);
    const sucursalNominaTotal = sucursalNominaEfectivo + sucursalNominaBanco;

    // Calcular taxes
    const taxRate = config.taxRate;
    const adminTaxEfectivo = adminEfectivo * (taxRate / 100);
    const adminTaxBanco = adminBanco * (taxRate / 100);
    const sucursalTaxEfectivo = sucursalEfectivo * (taxRate / 100);
    const sucursalTaxBanco = sucursalBanco * (taxRate / 100);

    // Calcular neto después de taxes
    const adminNetoEfectivo = adminEfectivo - adminTaxEfectivo;
    const adminNetoBanco = adminBanco - adminTaxBanco;
    const sucursalNetoEfectivo = sucursalEfectivo - sucursalTaxEfectivo;
    const sucursalNetoBanco = sucursalBanco - sucursalTaxBanco;

    // Calcular distribución de fondos
    const calcularDistribucion = (neto: number) => ({
      ahorro: neto * (config.porcentajeAhorro / 100),
      inversion: neto * (config.porcentajeInversion / 100),
      emergencia: neto * (config.porcentajeEmergencia / 100),
      disponible: neto * (config.porcentajeDisponible / 100),
    });

    const adminDistEfectivo = calcularDistribucion(adminNetoEfectivo);
    const adminDistBanco = calcularDistribucion(adminNetoBanco);
    const sucursalDistEfectivo = calcularDistribucion(sucursalNetoEfectivo);
    const sucursalDistBanco = calcularDistribucion(sucursalNetoBanco);

    return {
      config,
      admin: {
        ingresoEfectivo: adminEfectivo,
        ingresoBanco: adminBanco,
        gastoEfectivo: adminGastosEfectivo,
        gastoBanco: adminGastosBanco,
        nominaEfectivo: adminNominaEfectivo,
        nominaBanco: adminNominaBanco,
        nominaTotal: adminNominaTotal,
        payrollRecords: adminPayroll,
        taxEfectivo: adminTaxEfectivo,
        taxBanco: adminTaxBanco,
        netoEfectivo: adminNetoEfectivo,
        netoBanco: adminNetoBanco,
        distribucionEfectivo: adminDistEfectivo,
        distribucionBanco: adminDistBanco,
        totalIngresos: adminEfectivo + adminBanco,
        totalGastos: adminGastosEfectivo + adminGastosBanco,
        totalTax: adminTaxEfectivo + adminTaxBanco,
        totalNeto: adminNetoEfectivo + adminNetoBanco,
        transacciones: adminTransactions.length,
      },
      sucursal: {
        ingresoEfectivo: sucursalEfectivo,
        ingresoBanco: sucursalBanco,
        gastoEfectivo: sucursalGastosEfectivo,
        gastoBanco: sucursalGastosBanco,
        nominaEfectivo: sucursalNominaEfectivo,
        nominaBanco: sucursalNominaBanco,
        nominaTotal: sucursalNominaTotal,
        payrollRecords: sucursalPayroll,
        taxEfectivo: sucursalTaxEfectivo,
        taxBanco: sucursalTaxBanco,
        netoEfectivo: sucursalNetoEfectivo,
        netoBanco: sucursalNetoBanco,
        distribucionEfectivo: sucursalDistEfectivo,
        distribucionBanco: sucursalDistBanco,
        totalIngresos: sucursalEfectivo + sucursalBanco,
        totalGastos: sucursalGastosEfectivo + sucursalGastosBanco,
        totalTax: sucursalTaxEfectivo + sucursalTaxBanco,
        totalNeto: sucursalNetoEfectivo + sucursalNetoBanco,
        transacciones: sucursalTransactions.length,
      },
      general: {
        totalIngresos: adminEfectivo + adminBanco + sucursalEfectivo + sucursalBanco,
        totalGastos: adminGastosEfectivo + adminGastosBanco + sucursalGastosEfectivo + sucursalGastosBanco,
        totalTax: adminTaxEfectivo + adminTaxBanco + sucursalTaxEfectivo + sucursalTaxBanco,
        totalNeto: adminNetoEfectivo + adminNetoBanco + sucursalNetoEfectivo + sucursalNetoBanco,
        transacciones: weeklyTransactions.length,
      },
    };
  }, [transacciones, configData, payrollData, empleados]);

  // Datos para gráfica comparativa
  const chartData = useMemo(() => [
    {
      name: 'Fixopolis Solutions',
      Ingresos: data.admin.totalIngresos,
      Gastos: data.admin.totalGastos,
      Neto: data.admin.totalNeto,
    },
    {
      name: 'Downtown',
      Ingresos: data.sucursal.totalIngresos,
      Gastos: data.sucursal.totalGastos,
      Neto: data.sucursal.totalNeto,
    },
  ], [data]);

  const handleDownloadPDF = async (tipo: 'admin' | 'sucursal' | 'general') => {
    setGeneratingReport(true);
    try {
      // Importar jsPDF dinámicamente
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      // Crear contenido del reporte
      const fecha = new Date().toLocaleDateString('es-MX');
      let reportData;
      let titulo;
      
      if (tipo === 'admin') {
        reportData = data.admin;
        titulo = 'Fixopolis Solutions - Reporte Semanal';
      } else if (tipo === 'sucursal') {
        reportData = data.sucursal;
        titulo = 'Fixopolis Solutions Sucursal - Reporte Semanal';
      } else {
        reportData = data.general;
        titulo = 'Fixopolis Solutions - Reporte General';
      }

      // Crear PDF
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(18);
      doc.setTextColor(37, 99, 235); // Color azul
      doc.text(titulo, 14, 20);
      
      // Fecha
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Fecha de generación: ${fecha}`, 14, 28);
      
      // Tabla de resumen financiero
      autoTable(doc, {
        startY: 35,
        head: [['Concepto', 'Monto']],
        body: [
          ['Total Ingresos', `$${reportData.totalIngresos.toFixed(2)}`],
          ['Total Gastos', `$${reportData.totalGastos.toFixed(2)}`],
          [`Impuestos (${data.config.taxRate}%)`, `$${reportData.totalTax.toFixed(2)}`],
          ['Ingreso Neto', `$${reportData.totalNeto.toFixed(2)}`],
          ['Transacciones', `${reportData.transacciones}`],
        ],
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        bodyStyles: {
          textColor: [50, 50, 50],
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        styles: {
          fontSize: 11,
          cellPadding: 5,
        },
      });
      
      // Si hay datos de efectivo y banco, agregar tabla detallada
      if (tipo !== 'general') {
        const yPos = (doc as any).lastAutoTable.finalY + 10;
        
        doc.setFontSize(14);
        doc.setTextColor(37, 99, 235);
        doc.text('Detalle por Método de Pago', 14, yPos);
        
        autoTable(doc, {
          startY: yPos + 5,
          head: [['Concepto', 'Efectivo', 'Banco']],
          body: [
            ['Ingresos', `$${reportData.ingresoEfectivo.toFixed(2)}`, `$${reportData.ingresoBanco.toFixed(2)}`],
            ['Gastos', `$${reportData.gastoEfectivo.toFixed(2)}`, `$${reportData.gastoBanco.toFixed(2)}`],
            ['Impuestos', `$${reportData.taxEfectivo.toFixed(2)}`, `$${reportData.taxBanco.toFixed(2)}`],
            ['Neto', `$${reportData.netoEfectivo.toFixed(2)}`, `$${reportData.netoBanco.toFixed(2)}`],
          ],
          headStyles: {
            fillColor: [37, 99, 235],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          bodyStyles: {
            textColor: [50, 50, 50],
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
          styles: {
            fontSize: 10,
            cellPadding: 4,
          },
        });
        
        // Distribución de fondos
        const yPos2 = (doc as any).lastAutoTable.finalY + 10;
        
        doc.setFontSize(14);
        doc.setTextColor(37, 99, 235);
        doc.text('Distribución de Fondos', 14, yPos2);
        
        autoTable(doc, {
          startY: yPos2 + 5,
          head: [['Categoría', 'Efectivo', 'Banco']],
          body: [
            [`Ahorro (${data.config.porcentajeAhorro}%)`, `$${reportData.distribucionEfectivo.ahorro.toFixed(2)}`, `$${reportData.distribucionBanco.ahorro.toFixed(2)}`],
            [`Inversión (${data.config.porcentajeInversion}%)`, `$${reportData.distribucionEfectivo.inversion.toFixed(2)}`, `$${reportData.distribucionBanco.inversion.toFixed(2)}`],
            [`Emergencia (${data.config.porcentajeEmergencia}%)`, `$${reportData.distribucionEfectivo.emergencia.toFixed(2)}`, `$${reportData.distribucionBanco.emergencia.toFixed(2)}`],
            [`Disponible (${data.config.porcentajeDisponible}%)`, `$${reportData.distribucionEfectivo.disponible.toFixed(2)}`, `$${reportData.distribucionBanco.disponible.toFixed(2)}`],
          ],
          headStyles: {
            fillColor: [37, 99, 235],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          bodyStyles: {
            textColor: [50, 50, 50],
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
          styles: {
            fontSize: 10,
            cellPadding: 4,
          },
        });
        
        // Tabla de Nómina Pagada
        if (reportData.payrollRecords && reportData.payrollRecords.length > 0) {
          const yPos3 = (doc as any).lastAutoTable.finalY + 10;
          
          doc.setFontSize(14);
          doc.setTextColor(37, 99, 235);
          doc.text('Nómina Pagada', 14, yPos3);
          
          // Preparar datos de nómina con nombres de empleados
          const nominaBody = reportData.payrollRecords.map((pago: any) => {
            const empleado = empleados.find((e: any) => e.id === pago.employeeId);
            const efectivo = pago.metodo === 'efectivo' ? parseFloat(pago.monto) : 0;
            const banco = pago.metodo === 'banco' ? parseFloat(pago.monto) : 0;
            return [
              empleado?.nombre || 'Desconocido',
              `$${efectivo.toFixed(2)}`,
              `$${banco.toFixed(2)}`,
              `$${parseFloat(pago.monto).toFixed(2)}`,
            ];
          });
          
          // Agregar fila de totales
          nominaBody.push([
            'TOTAL NÓMINA',
            `$${reportData.nominaEfectivo.toFixed(2)}`,
            `$${reportData.nominaBanco.toFixed(2)}`,
            `$${reportData.nominaTotal.toFixed(2)}`,
          ]);
          
          autoTable(doc, {
            startY: yPos3 + 5,
            head: [['Empleado', 'Efectivo', 'Banco', 'Total']],
            body: nominaBody,
            headStyles: {
              fillColor: [37, 99, 235],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
            },
            bodyStyles: {
              textColor: [50, 50, 50],
            },
            alternateRowStyles: {
              fillColor: [245, 245, 245],
            },
            styles: {
              fontSize: 10,
              cellPadding: 4,
            },
            // Estilo especial para la última fila (totales)
            didParseCell: function(data: any) {
              if (data.row.index === nominaBody.length - 1) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [220, 220, 220];
              }
            },
          });
        }
      }
      
      // Guardar PDF
      doc.save(`Reporte_${tipo}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success('Reporte PDF descargado exitosamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar el reporte PDF');
    } finally {
      setGeneratingReport(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            Reportes Semanales
          </h1>
          <p className="text-muted-foreground mt-1">
            Resumen financiero de los últimos 7 días
          </p>
        </div>

        {/* Tarjetas de resumen general */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-green-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-green-700">${data.general.totalIngresos.toFixed(2)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <div className="flex items-center gap-3">
              <Receipt className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm text-red-600">Gastos Totales</p>
                <p className="text-2xl font-bold text-red-700">${data.general.totalGastos.toFixed(2)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm text-yellow-600">Impuestos</p>
                <p className="text-2xl font-bold text-yellow-700">${data.general.totalTax.toFixed(2)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center gap-3">
              <PiggyBank className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600">Neto Total</p>
                <p className="text-2xl font-bold text-blue-700">${data.general.totalNeto.toFixed(2)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Gráfica comparativa */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Comparativa por Tienda
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="Ingresos" fill="#10B981" />
                <Bar dataKey="Gastos" fill="#EF4444" />
                <Bar dataKey="Neto" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Reportes por tienda */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reporte Admin */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Fixopolis Solutions (Principal)
              </h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleDownloadPDF('admin')}
                disabled={generatingReport}
              >
                {generatingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Descargar
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-green-700">Ingresos Efectivo</span>
                <span className="font-bold text-green-800">${data.admin.ingresoEfectivo.toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-700">Ingresos Banco</span>
                <span className="font-bold text-blue-800">${data.admin.ingresoBanco.toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-red-700">Gastos Totales</span>
                <span className="font-bold text-red-800">${data.admin.totalGastos.toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="text-yellow-700">Impuestos ({data.config.taxRate}%)</span>
                <span className="font-bold text-yellow-800">${data.admin.totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-3 bg-purple-50 rounded-lg border-2 border-purple-200">
                <span className="text-purple-700 font-semibold">Neto Total</span>
                <span className="font-bold text-purple-800">${data.admin.totalNeto.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          {/* Reporte Sucursal */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Store className="h-5 w-5 text-orange-600" />
                Fixopolis Solutions Sucursal
              </h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleDownloadPDF('sucursal')}
                disabled={generatingReport}
              >
                {generatingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Descargar
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-green-700">Ingresos Efectivo</span>
                <span className="font-bold text-green-800">${data.sucursal.ingresoEfectivo.toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-700">Ingresos Banco</span>
                <span className="font-bold text-blue-800">${data.sucursal.ingresoBanco.toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-red-700">Gastos Totales</span>
                <span className="font-bold text-red-800">${data.sucursal.totalGastos.toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="text-yellow-700">Impuestos ({data.config.taxRate}%)</span>
                <span className="font-bold text-yellow-800">${data.sucursal.totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-3 bg-purple-50 rounded-lg border-2 border-purple-200">
                <span className="text-purple-700 font-semibold">Neto Total</span>
                <span className="font-bold text-purple-800">${data.sucursal.totalNeto.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Botón de reporte general */}
        {isAdmin && (
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Reporte General Consolidado
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Incluye datos de ambas tiendas
                </p>
              </div>
              <Button 
                onClick={() => handleDownloadPDF('general')}
                disabled={generatingReport}
              >
                {generatingReport ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                Generar Reporte General
              </Button>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

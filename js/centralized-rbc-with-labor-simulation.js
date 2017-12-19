// Functions

// Define a rounding function for display precision
round = function(x,n) { return Math.round(Math.pow(10,n)*x)/Math.pow(10,n); };

// Define a square function for root-finding
sqr = function(x) { return x*x; };

// Define a rounding function for display precision
round = function(x,n) { return Math.round(Math.pow(10,n)*x)/Math.pow(10,n); }; 



$(document).ready(function () {

    $('#ParameterInput').on('submit', function (e) {
        e.preventDefault();
        var tfp = parseFloat($('#tfp').val());
        var alpha = parseFloat($('#alpha').val());
        var delta = parseFloat($('#delta').val());
        var beta = parseFloat($('#beta').val());
        var sigma = parseFloat($('#sigma').val());
        var eta = parseFloat($('#eta').val());
        var phi = parseFloat($('#phi').val());
        var rhoA = parseFloat($('#rhoA').val());
        var sigA = parseFloat($('#sigA').val());
        var periods = parseInt($('#periods').val());
        var stochSim = document.getElementById ("stochSim");
        var random = new Random ();
        var minForMarkers = 30;
        
        ////////////////////////////////////////////////////////////////////
        // BEGIN WHAT SHOULD BE DONE IN PYTHON

        // Compute steady state

        // Capital-to-labor ratio
        var KL = Math.pow(alpha*tfp/(Math.pow(beta,-1)+delta-1),1/(1-alpha));

        // Function to be solved to find steady state labor
        l_fun = function(x) { 
            return 1/phi*Math.pow((tfp*Math.pow(KL,alpha)-delta*KL),-sigma)*(1-alpha)*tfp*Math.pow(KL,alpha)- Math.pow(x,sigma)*Math.pow(1-x,-eta);
        };

        // Solve for steady state labor
        var L = numeric.uncmin(function(x) { return sqr(l_fun(x[0])); },[0.5]).solution;

        // Solve for other endogenous variables.
        var K = KL*L;
        var Y = tfp*Math.pow(K,alpha)*Math.pow(L,1-alpha);
        var I = delta*K;
        var C = Y - I;

        // Compute coefficients for log-linear approximation
        var GAMMA  = Math.pow(1-L,-eta)/tfp*Math.pow(K,-alpha)*Math.pow(L,alpha);
        var PHI = 1/sigma*Math.pow(phi/(1-alpha)*Math.pow(1-L,-eta)*Math.pow(tfp,-1)*Math.pow(K,-alpha)*Math.pow(L,alpha),-1/sigma);

        var phi_01 = beta*GAMMA*(alpha*(delta-1)-alpha*Y/K);
        var phi_02 = beta*GAMMA*(eta*Math.pow(1-L,-1)*L*(alpha*Y/K+1-delta) + alpha*Y/K + alpha*(1 - delta));
        var phi_03 = -alpha*GAMMA;

        var phi_00 = beta*GAMMA*(delta-1);
        var phi_04_lhs = phi_00*rhoA;
        var phi_04_rhs = -GAMMA;

        var phi_04=-phi_04_lhs+phi_04_rhs;
        var phi_05 = GAMMA*(eta*L/(1-L)+alpha);
        var phi_06 = K;
        var phi_08 = alpha*Y + (1-delta)*K - PHI*alpha;
        var phi_09 = Y - PHI;
        var phi_10 = PHI*(eta*Math.pow(1-L,-1)*L+alpha) + (1-alpha)*Y;


        //Compute solution coefficients
        var gamma_03_poly_a = phi_06**-1*phi_02*phi_10;
        var gamma_03_poly_b = phi_06**-1*(phi_01*phi_10+phi_02*phi_08)-phi_05;
        var gamma_03_poly_c = phi_06**-1*phi_01*phi_08-phi_03;

        var roots = [(-gamma_03_poly_b+Math.sqrt(Math.pow(gamma_03_poly_b,2)-4*gamma_03_poly_a*gamma_03_poly_c))/2/gamma_03_poly_a,(-gamma_03_poly_b-Math.sqrt(Math.pow(gamma_03_poly_b,2)-4*gamma_03_poly_a*gamma_03_poly_c))/2/gamma_03_poly_a];

        if (phi_06**-1*(phi_08+phi_10*roots[0]) >1 && phi_06**-1*(phi_08+phi_10*roots[1]) < 1 ) {

            var gamma_03 = roots[1];
            var gamma_01 = Math.pow(phi_06,-1)*(phi_08+phi_10*gamma_03);

            var gamma_04 = (phi_04-Math.pow(phi_06,-1)*(phi_02*gamma_03*phi_09 + phi_01*phi_09))/(Math.pow(phi_06,-1)*(phi_01*phi_10+phi_02*gamma_03*phi_10)+phi_02*rhoA-phi_05 );
            var gamma_02 = Math.pow(phi_06,-1)*(phi_09+phi_10*gamma_04);


        } else if (phi_06**-1*(phi_08+phi_10*roots[0]) <1 && phi_06**-1*(phi_08+phi_10*roots[1]) > 1 ) {

            var gamma_03 = roots[0];
            var gamma_01 = phi_06**-1*(phi_08+phi_10*gamma_03);

            var gamma_04 = (phi_04-Math.pow(phi_06,-1)*(phi_02*gamma_03*phi_09 + phi_01*phi_09))/(Math.pow(phi_06,-1)*(phi_01*phi_10+phi_02*gamma_03*phi_10)+phi_02*rhoA-phi_05 );
            var gamma_02 = Math.pow(phi_06,-1)*(phi_09+phi_10*gamma_04);


        } else if  (phi_06**-1*(phi_08+phi_10*roots[0]) <1 && phi_06**-1*(phi_08+phi_10*roots[1]) < 1 ) {
            
            window.alert('Too many stable solutions');

        } else { (phi_06**-1*(phi_08+phi_10*roots[0]) >=1 && phi_06**-1*(phi_08+phi_10*roots[1]) >= 1 )
            
            window.alert('No stable solutions');
        };

        

        var tme=[0];
        var eProc = [0];
        var aProc = [0];
        var kProc = [0];
        var lProc = [0];
        var yProc = [0];
        var iProc = [0];
        var cProc = [0];

        
        if (periods <minForMarkers ) {
            var enableMarks = true
        }
        else {
            var enableMarks = false;
        };



        if (stochSim.checked == true) {
            for (i = 1; i <= periods; i++) {
                tme.push(i);
                e = sigA*random.normal(0,1);
                a = rhoA*aProc[aProc.length-1] + e;
                k = gamma_01*kProc[kProc.length-1] + gamma_02*aProc[aProc.length-1];
                l = gamma_03*k + gamma_04*a;
                y = a + alpha*k + (1-alpha)*l;
                c = a/sigma+alpha*k/sigma-1/sigma*(alpha+eta*L/(1-L))*l;
                inv = Y/I*y - C/I*c;

                eProc.push(e);
                aProc.push(a);
                kProc.push(k);
                lProc.push(l);
                yProc.push(y);
                cProc.push(c);
                iProc.push(inv);
                
                
            eProc[0] = Math.NaN;
            };
        } else {

            tme.push(1);
            e = sigA;
            a = rhoA*aProc[aProc.length-1] + e;
            k = gamma_01*kProc[kProc.length-1] + gamma_02*aProc[aProc.length-1];
            l = gamma_03*k + gamma_04*a;
            y = a + alpha*k + (1-alpha)*l;
            c = a/sigma+alpha*k/sigma-1/sigma*(alpha+eta*L/(1-L))*l;
            inv = Y/I*y - C/I*c;

            eProc.push(e);
            aProc.push(a);
            kProc.push(k);
            lProc.push(l);
            yProc.push(y);
            cProc.push(c);
            iProc.push(inv);

            for (i = 2; i <= periods; i++) {
                tme.push(i);
                e = 0;
                a = rhoA*aProc[aProc.length-1] + e;
                k = gamma_01*kProc[kProc.length-1] + gamma_02*aProc[aProc.length-1];
                l = gamma_03*k + gamma_04*a;
                y = a + alpha*k + (1-alpha)*l;
                c = a/sigma+alpha*k/sigma-1/sigma*(alpha+eta*L/(1-L))*l;
                inv = Y/I*y - C/I*c;

                eProc.push(e);
                aProc.push(a);
                kProc.push(k);
                lProc.push(l);
                yProc.push(y);
                cProc.push(c);
                iProc.push(inv);

            };


        };

        // END WHAT SHOULD BE DONE IN PYTHON
        ////////////////////////////////////////////////////////////////////
        


        $('#eProc').highcharts({
            chart: {
                type: 'line',
                marginRight: 10,
            },

            credits: {
                enabled: false
            },

            plotOptions: {
                series: {
                    lineWidth: 3,
                    marker : {
                        enabled : false,
                        radius : 3},
                    animation: {
                        duration: 10000     //Controls the time required for plot to be fully rendered.
                    }
                }
            },

            title: {
                text: 'TFP shock process',
                useHTML:true,
                style: {
                    "fontSize": "15px"
                }
            },
            xAxis: {
                text: 'Time Period'
            },
            yAxis: {
                title: {
                    text: ''
                },
                labels: {
                    formatter: function() 
                    {
                        return round(this.value,2);
                    }
                },
                minRange: 0,
                plotLines: [{
                    value: 0,
                    width: 2,
                    color: '#808080'
                }]
            },

            legend: {
                enabled: false
            },
            exporting: {
                enabled: true,
                buttons: {
                    contextButton: {
                        menuItems: ['downloadPNG', 'downloadCSV']
                    },
                },
                csv: {
                    columnHeaderFormatter: function (series, key) {
                        if (key === 'y') {
                            return series.name;
                        } else {
                            return 'Time';
                        }
                    }
                },
            },
            series: [{
                name: 'epsilon',
                data: (function () {
                    var data = [];
                    for (i = 0; i <= periods; i++) {
                        data.push({
                            x: tme[i],
                            y: round(eProc[i],5),
                        })
                    }

                    return data;
                })()
            },
            ]
        });

        $('#aProc').highcharts({
            chart: {
                type: 'line',
                marginRight: 10,
            },

            credits: {
                enabled: false
            },

            plotOptions: {
                series: {
                    lineWidth: 3,
                    marker : {
                        enabled : false,
                        radius : 3},
                    animation: {
                        duration: 10000     //Controls the time required for plot to be fully rendered.
                    }
                }
            },

            title: {
                text: 'TFP',
                useHTML:true,
                style: {
                    "fontSize": "15px" 
                }
            },
            xAxis: {
                text: 'Time Period'
            },
            yAxis: {
                title: {
                    text: ''
                },
                labels: {
                    formatter: function() 
                    {
                        return round(this.value,2);
                    }
                },
                minRange: 0,
                plotLines: [{
                    value: 0,
                    width: 2,
                    color: '#808080'
                }]
            },

            legend: {
                enabled: false
            },
            exporting: {
                enabled: true,
                buttons: {
                    contextButton: {
                        menuItems: ['downloadPNG', 'downloadCSV']
                    },
                },
                csv: {
                    columnHeaderFormatter: function (series, key) {
                        if (key === 'y') {
                            return series.name;
                        } else {
                            return 'Time';
                        }
                    }
                },
            },
            series: [{
                name: 'a',
                data: (function () {
                    var data = [];
                    for (i = 0; i <= periods; i++) {
                        data.push({
                            x: tme[i],
                            y: round(aProc[i],5),
                        })
                    }

                    return data;
                })()
            },
            ]
        });
        
        $('#lProc').highcharts({
            chart: {
                type: 'line',
                marginRight: 10,
            },

            credits: {
                enabled: false
            },

            plotOptions: {
                series: {
                    lineWidth: 3,
                    marker : {
                        enabled : false,
                        radius : 3},
                    animation: {
                        duration: 10000     //Controls the time required for plot to be fully rendered.
                    }
                }
            },

            title: {
                text: 'Labor',
                useHTML:true,
                style: {
                    "fontSize": "15px"
                }
            },
            xAxis: {
                text: 'Time Period'
            },
            yAxis: {
                title: {
                    text: ''
                },
                labels: {
                    formatter: function() 
                    {
                        return round(this.value,2);
                    }
                },
                minRange: 0,
                plotLines: [{
                    value: 0,
                    width: 2,
                    color: '#808080'
                }]
            },

            legend: {
                enabled: false
            },
            exporting: {
                enabled: true,
                buttons: {
                    contextButton: {
                        menuItems: ['downloadPNG', 'downloadCSV']
                    },
                },
                csv: {
                    columnHeaderFormatter: function (series, key) {
                        if (key === 'y') {
                            return series.name;
                        } else {
                            return 'Time';
                        }
                    }
                },
            },
            series: [{
                name: 'l',
                data: (function () {
                    var data = [];
                    for (i = 0; i <= periods; i++) {
                        data.push({
                            x: tme[i],
                            y: round(lProc[i],5),
                        })
                    }

                    return data;
                })()
            },
            ]
        });

        $('#yProc').highcharts({
            chart: {
                type: 'line',
                marginRight: 10,
            },

            credits: {
                enabled: false
            },

            plotOptions: {
                series: {
                    lineWidth: 3,
                    marker : {
                        enabled : false,
                        radius : 3},
                    animation: {
                        duration: 10000     //Controls the time required for plot to be fully rendered.
                    }
                }
            },

            title: {
                text: 'Output',
                useHTML:true,
                style: {
                    "fontSize": "15px" 
                }
            },
            xAxis: {
                text: 'Time Period'
            },
            yAxis: {
                title: {
                    text: ''
                },
                labels: {
                    formatter: function() 
                    {
                        return round(this.value,2);
                    }
                },
                minRange: 0,
                plotLines: [{
                    value: 0,
                    width: 2,
                    color: '#808080'
                }]
            },

            legend: {
                enabled: false
            },
            exporting: {
                enabled: true,
                buttons: {
                    contextButton: {
                        menuItems: ['downloadPNG', 'downloadCSV']
                    },
                },
                csv: {
                    columnHeaderFormatter: function (series, key) {
                        if (key === 'y') {
                            return series.name;
                        } else {
                            return 'Time';
                        }
                    }
                },
            },
            series: [{
                name: 'y',
                data: (function () {
                    var data = [];
                    for (i = 0; i <= periods; i++) {
                        data.push({
                            x: tme[i],
                            y: round(yProc[i],5),
                        })
                    }

                    return data;
                })()
            },
            ]
        });

        $('#kProc').highcharts({
            chart: {
                type: 'line',
                marginRight: 10,
            },

            credits: {
                enabled: false
            },

            plotOptions: {
                series: {
                    lineWidth: 3,
                    marker : {
                        enabled : false,
                        radius : 3},
                    animation: {
                        duration: 10000     //Controls the time required for plot to be fully rendered.
                    }
                }
            },

            title: {
                text: 'Capital',
                useHTML:true,
                style: {
                    "fontSize": "15px"
                }
            },
            xAxis: {
                text: 'Time Period'
            },
            yAxis: {
                title: {
                    text: ''
                },
                labels: {
                    formatter: function() 
                    {
                        return round(this.value,2);
                    }
                },
                minRange: 0,
                plotLines: [{
                    value: 0,
                    width: 2,
                    color: '#808080'
                }]
            },

            legend: {
                enabled: false
            },
            exporting: {
                enabled: true,
                buttons: {
                    contextButton: {
                        menuItems: ['downloadPNG', 'downloadCSV']
                    },
                },
                csv: {
                    columnHeaderFormatter: function (series, key) {
                        if (key === 'y') {
                            return series.name;
                        } else {
                            return 'Time';
                        }
                    }
                },
            },
            series: [{
                name: 'k',
                data: (function () {
                    var data = [];
                    for (i = 0; i <= periods; i++) {
                        data.push({
                            x: tme[i],
                            y: round(kProc[i],5),
                        })
                    }

                    return data;
                })()
            },
            ]
        });

        $('#iProc').highcharts({
            chart: {
                type: 'line',
                marginRight: 10,
            },

            credits: {
                enabled: false
            },

            plotOptions: {
                series: {
                    lineWidth: 3,
                    marker : {
                        enabled : false,
                        radius : 3},
                    animation: {
                        duration: 10000     //Controls the time required for plot to be fully rendered.
                    }
                }
            },

            title: {
                text: 'Investment',
                useHTML:true,
                style: {
                    "fontSize": "15px" 
                }
            },
            xAxis: {
                text: 'Time Period'
            },
            yAxis: {
                title: {
                    text: ''
                },
                labels: {
                    formatter: function() 
                    {
                        return round(this.value,2);
                    }
                },
                minRange: 0,
                plotLines: [{
                    value: 0,
                    width: 2,
                    color: '#808080'
                }]
            },

            legend: {
                enabled: false
            },
            exporting: {
                enabled: true,
                buttons: {
                    contextButton: {
                        menuItems: ['downloadPNG', 'downloadCSV']
                    },
                },
                csv: {
                    columnHeaderFormatter: function (series, key) {
                        if (key === 'y') {
                            return series.name;
                        } else {
                            return 'Time';
                        }
                    }
                },
            },
            series: [{
                name: 'Investment',
                data: (function () {
                    var data = [];
                    for (i = 0; i <= periods; i++) {
                        data.push({
                            x: tme[i],
                            y: round(iProc[i],5),
                        })
                    }

                    return data;
                })()
            },
            ]
        });

        $('#cProc').highcharts({
            chart: {
                type: 'line',
                marginRight: 10,
            },

            credits: {
                enabled: false
            },

            plotOptions: {
                series: {
                    lineWidth: 3,
                    marker : {
                        enabled : false,
                        radius : 3},
                    animation: {
                        duration: 10000     //Controls the time required for plot to be fully rendered.
                    }
                }
            },

            title: {
                text: 'Consumption',
                useHTML:true,
                style: {
                    "fontSize": "15px" 
                }
            },
            xAxis: {
                text: 'Time Period'
            },
            yAxis: {
                title: {
                    text: ''
                },
                labels: {
                    formatter: function() 
                    {
                        return round(this.value,2);
                    }
                },
                minRange: 0,
                plotLines: [{
                    value: 0,
                    width: 2,
                    color: '#808080'
                }]
            },

            legend: {
                enabled: false
            },
            exporting: {
                enabled: true,
                buttons: {
                    contextButton: {
                        menuItems: ['downloadPNG', 'downloadCSV']
                    },
                },
                csv: {
                    columnHeaderFormatter: function (series, key) {
                        if (key === 'y') {
                            return series.name;
                        } else {
                            return 'Time';
                        }
                    }
                },
            },
            series: [{
                name: 'Consumption',
                data: (function () {
                    var data = [];
                    for (i = 0; i <= periods; i++) {
                        data.push({
                            x: tme[i],
                            y: round(cProc[i],5),
                        })
                    }

                    return data;
                })()
            },
            ]
        });

        


    

    })
});

function reloadFunction() {
    location.reload();
}
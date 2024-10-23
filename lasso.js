(function(global, factory) {
    if (typeof d3 !== 'undefined') {
        factory(d3);
    } else {
        console.error("D3.js must be loaded before the d3-lasso script.");
    }
}(this, function(d3) {
    // Lasso code
    function lasso() {
        var items = [],
            closePathDistance = 75,
            closePathSelect = true,
            isPathClosed = false,
            hoverSelect = true,
            targetArea,
            on = { start: function() {}, draw: function() {}, end: function() {} };

        // Function to execute on call
        function lassoInstance(_this) {
            var g = _this.append("g").attr("class", "lasso");
            var dyn_path = g.append("path").attr("class", "drawn");
            var close_path = g.append("path").attr("class", "loop_close");
            var origin_node = g.append("circle").attr("class", "origin");

            var tpath, origin, torigin, drawnCoords;

            var dragAction = d3.drag()
                .on("start", dragstart)
                .on("drag", dragmove)
                .on("end", dragend);

            targetArea.call(dragAction);

            function dragstart() {
                drawnCoords = [];
                tpath = "";
                dyn_path.attr("d", null);
                close_path.attr("d", null);

                items.nodes().forEach(function(e) {
                    e.__lasso = {
                        possible: false,
                        selected: false,
                        hoverSelect: false,
                        loopSelect: false
                    };

                    var box = e.getBoundingClientRect();
                    e.__lasso.lassoPoint = [
                        Math.round(box.left + box.width / 2),
                        Math.round(box.top + box.height / 2)
                    ];
                });

                if (hoverSelect) {
                    items.on("mouseover.lasso", function() {
                        this.__lasso.hoverSelect = true;
                    });
                }

                on.start();
            }

            function dragmove(event) {
                var x, y;
                if (event.sourceEvent.type === "touchmove") {
                    x = event.sourceEvent.touches[0].clientX;
                    y = event.sourceEvent.touches[0].clientY;
                } else {
                    x = event.sourceEvent.clientX;
                    y = event.sourceEvent.clientY;
                }

                var tx = d3.pointer(event, this)[0];
                var ty = d3.pointer(event, this)[1];

                if (tpath === "") {
                    tpath = `M ${tx} ${ty}`;
                    origin = [x, y];
                    torigin = [tx, ty];
                    origin_node.attr("cx", tx).attr("cy", ty).attr("r", 7).attr("display", null);
                } else {
                    tpath += ` L ${tx} ${ty}`;
                }

                drawnCoords.push([x, y]);

                var distance = Math.sqrt(Math.pow(x - origin[0], 2) + Math.pow(y - origin[1], 2));
                var close_draw_path = `M ${tx} ${ty} L ${torigin[0]} ${torigin[1]}`;
                dyn_path.attr("d", tpath);
                close_path.attr("d", close_draw_path);

                isPathClosed = distance <= closePathDistance;

                if (isPathClosed && closePathSelect) {
                    close_path.attr("display", null);
                } else {
                    close_path.attr("display", "none");
                }

                items.nodes().forEach(function(n) {
                    n.__lasso.loopSelect = isPathClosed && closePathSelect
                        ? (classifyPoint(drawnCoords, n.__lasso.lassoPoint) < 1)
                        : false;
                    n.__lasso.possible = n.__lasso.hoverSelect || n.__lasso.loopSelect;
                });

                on.draw();
            }

            function dragend() {
                items.on("mouseover.lasso", null);
                items.nodes().forEach(function(n) {
                    n.__lasso.selected = n.__lasso.possible;
                    n.__lasso.possible = false;
                });

                dyn_path.attr("d", null);
                close_path.attr("d", null);
                origin_node.attr("display", "none");

                on.end();
            }
        }

        lassoInstance.items = function(_) {
            if (!arguments.length) return items;
            items = _;
            items.nodes().forEach(function(n) {
                n.__lasso = {
                    possible: false,
                    selected: false
                };
            });
            return lassoInstance;
        };

        lassoInstance.possibleItems = function() {
            return items.filter(function() {
                return this.__lasso.possible;
            });
        };

        lassoInstance.selectedItems = function() {
            return items.filter(function() {
                return this.__lasso.selected;
            });
        };

        lassoInstance.notPossibleItems = function() {
            return items.filter(function() {
                return !this.__lasso.possible;
            });
        };

        lassoInstance.notSelectedItems = function() {
            return items.filter(function() {
                return !this.__lasso.selected;
            });
        };

        lassoInstance.closePathDistance = function(_) {
            if (!arguments.length) return closePathDistance;
            closePathDistance = _;
            return lassoInstance;
        };

        lassoInstance.closePathSelect = function(_) {
            if (!arguments.length) return closePathSelect;
            closePathSelect = _ === true;
            return lassoInstance;
        };

        lassoInstance.isPathClosed = function(_) {
            if (!arguments.length) return isPathClosed;
            isPathClosed = _ === true;
            return lassoInstance;
        };

        lassoInstance.hoverSelect = function(_) {
            if (!arguments.length) return hoverSelect;
            hoverSelect = _ === true;
            return lassoInstance;
        };

        lassoInstance.on = function(type, _) {
            if (!arguments.length) return on;
            if (arguments.length === 1) return on[type];
            const types = ["start", "draw", "end"];
            if (types.includes(type)) {
                on[type] = _;
            }
            return lassoInstance;
        };

        lassoInstance.targetArea = function(_) {
            if (!arguments.length) return targetArea;
            targetArea = _;
            return lassoInstance;
        };

        return lassoInstance;
    }

    // Attach lasso to the global d3 object
    d3.lasso = lasso;
}));

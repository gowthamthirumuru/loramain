% Trilateration Visualization Demo (Distance Input)
% Visualizes trilateration based on distances between anchors and tourist.

clc; clear; close all;

disp('--- Trilateration Visualization Demo ---');
disp('Enter the distances as requested.');

% --- 1. User Inputs (Distances) ---
% Default values (Equilateral Triangle Side 10, Tourist at (5, 2.89))
def_d12 = 10;
def_d13 = 10;
def_d23 = 10;
def_r1  = 5.77; % Dist from (0,0) to approx centroid (5, 2.89)
def_r2  = 5.77;
def_r3  = 2.89; % Dist from (5, 8.66) to (5, 2.89) is 5.77? Wait. 
                % Centroid of eq triangle side 10 is at y = 10*sqrt(3)/6 = 2.886.
                % Distance from A(0,0) to Centroid(5, 2.886): sqrt(25 + 2.886^2) = sqrt(25+8.33) = 5.77
                % Distance from C(5, 8.66) to Centroid(5, 2.886): 8.66 - 2.886 = 5.77
                
% 1. Distance between Anchor 1 and Anchor 2
fprintf('\n1. Enter distance between Anchor 1 and Anchor 2 [Default: 10]: ');
d12 = input(''); if isempty(d12), d12 = def_d12; end

% 2. Distance between Anchor 1 and Anchor 3
fprintf('2. Enter distance between Anchor 1 and Anchor 3 [Default: 10]: ');
d13 = input(''); if isempty(d13), d13 = def_d13; end

% 3. Distance between Anchor 2 and Anchor 3
fprintf('3. Enter distance between Anchor 2 and Anchor 3 [Default: 10]: ');
d23 = input(''); if isempty(d23), d23 = def_d23; end

% Tourist Distances
fprintf('\nNow enter Tourist distances:\n');
fprintf('Distance from Tourist to Anchor 1 (r1) [Default: 5.77]: ');
r1 = input(''); if isempty(r1), r1 = def_r1; end

fprintf('Distance from Tourist to Anchor 2 (r2) [Default: 5.77]: ');
r2 = input(''); if isempty(r2), r2 = def_r2; end

fprintf('Distance from Tourist to Anchor 3 (r3) [Default: 5.77]: ');
r3 = input(''); if isempty(r3), r3 = def_r3; end

% --- 2. Calculate Anchor Coordinates ---
% Anchor 1 at (0,0)
x1 = 0; y1 = 0;

% Anchor 2 at (d12, 0)
x2 = d12; y2 = 0;

% Anchor 3 at intersection of circle(A1, d13) and circle(A2, d23)
% x3 = (d12^2 + d13^2 - d23^2) / (2 * d12)
x3 = (d12^2 + d13^2 - d23^2) / (2 * d12);
y3 = sqrt(d13^2 - x3^2);

anchors = [x1, y1; x2, y2; x3, y3];

% --- 3. Calculate Tourist Coordinate ---
% Using standard trilateration algorithm for 3 circles
A = 2 * x2 - 2 * x1;
B = 2 * y2 - 2 * y1;
C = r1^2 - r2^2 - x1^2 + x2^2 - y1^2 + y2^2;
D = 2 * x3 - 2 * x2;
E = 2 * y3 - 2 * y2;
F = r2^2 - r3^2 - x2^2 + x3^2 - y2^2 + y3^2;

xt = (C*E - F*B) / (E*A - B*D);
yt = (C*D - A*F) / (B*D - A*E);

% --- 4. Visualization ---
figure('Name', 'Trilateration Diagram', 'Color', 'w');
hold on; axis equal; grid on;

% Add faint grid lines similar to graph paper
ax = gca;
ax.GridColor = [0.8 0.8 0.8]; % Light grey grid
ax.GridAlpha = 0.5;
ax.LineWidth = 1.0; % Axis lines

% Padding
padding = max([d12, d13, d23]) * 0.2;
xlim([min([x1, x2, x3, xt])-padding, max([x1, x2, x3, xt])+padding]);
ylim([min([y1, y2, y3, yt])-padding, max([y1, y2, y3, yt])+padding]);

% --- Draw Triangle (Anchors) ---
% Light/Thin lines for the triangle
line([x1, x2], [y1, y2], 'Color', [0.5 0.5 0.5], 'LineWidth', 1.5);
line([x2, x3], [y2, y3], 'Color', [0.5 0.5 0.5], 'LineWidth', 1.5);
line([x3, x1], [y3, y1], 'Color', [0.5 0.5 0.5], 'LineWidth', 1.5);

% Plot Anchors
plot(x1, y1, 'k.', 'MarkerSize', 15); % Vertex A
plot(x2, y2, 'k.', 'MarkerSize', 15); % Vertex B
plot(x3, y3, 'k.', 'MarkerSize', 15); % Vertex C

% Label Anchors
text(x1, y1-padding/2, 'Anchor 1 (0,0)', 'HorizontalAlignment', 'center', 'FontSize', 10);
text(x2, y2-padding/2, sprintf('Anchor 2 (%.1f, %.1f)', x2, y2), 'HorizontalAlignment', 'center', 'FontSize', 10);
text(x3, y3+padding/2, sprintf('Anchor 3 (%.1f, %.1f)', x3, y3), 'HorizontalAlignment', 'center', 'FontSize', 10);

% --- Draw Tourist and Connection Lines ---
% Lines from Anchors to Tourist (Solid black as per sketch style)
plot([x1, xt], [y1, yt], 'k-', 'LineWidth', 1.2);
plot([x2, xt], [y2, yt], 'k-', 'LineWidth', 1.2);
plot([x3, xt], [y3, yt], 'k-', 'LineWidth', 1.2);

% Intersection Point (Tourist)
plot(xt, yt, 'ko', 'MarkerSize', 6, 'MarkerFaceColor', 'b'); % Blue/Black dot

% Label Coordinates with parentheses e.g. (5, 2.89)
text(xt + padding/4, yt, sprintf('(%.2f, %.2f)', xt, yt), 'FontSize', 11, 'FontWeight', 'bold');

% --- Draw Projection Lines (Perpendiculars) like sketch ---
% Vertical line to X-axis
line([xt, xt], [0, yt], 'Color', 'k', 'LineStyle', '-', 'LineWidth', 1);
% Horizontal line to Y-axis
line([0, xt], [yt, yt], 'Color', 'k', 'LineStyle', '-', 'LineWidth', 1);

% Label Projections on Axes
text(xt, -padding/4, sprintf('%.1f', xt), 'HorizontalAlignment', 'center', 'FontSize', 9);
text(-padding/4, yt, sprintf('%.2f', yt), 'HorizontalAlignment', 'right', 'FontSize', 9);

% --- Draw Circles (Light Colored) ---
theta = linspace(0, 2*pi, 200);

% Circle 1
cx1 = x1 + r1 * cos(theta);
cy1 = y1 + r1 * sin(theta);
plot(cx1, cy1, 'Color', [0.3010 0.7450 0.9330 0.4], 'LineWidth', 1.5); % Light Blue

% Circle 2
cx2 = x2 + r2 * cos(theta);
cy2 = y2 + r2 * sin(theta);
plot(cx2, cy2, 'Color', [0.4660 0.6740 0.1880 0.4], 'LineWidth', 1.5); % Light Green

% Circle 3
cx3 = x3 + r3 * cos(theta);
cy3 = y3 + r3 * sin(theta);
plot(cx3, cy3, 'Color', [0.9290 0.6940 0.1250 0.4], 'LineWidth', 1.5); % Light Yellow/Orange

title('Trilateration Geometry');
xlabel('X');
ylabel('Y');
hold off;

disp('Plot generated.');

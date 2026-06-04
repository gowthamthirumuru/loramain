% IoT Live Tracking Visualization
% Visualizes anchors and tourists in real-time from the backend API.

% --- Configuration ---
API_URL = 'http://localhost:5000/api/location/active';
ANCHORS_FILE = '../config/anchors.json';
REFRESH_RATE = 1.0; % Seconds

% --- Setup Figure ---
hFig = figure('Name', 'IoT Live Tracking', 'NumberTitle', 'off', 'Color', 'w');
ax = axes('Parent', hFig);
hold(ax, 'on');
grid(ax, 'on');
axis(ax, 'equal');
xlabel(ax, 'X (meters)');
ylabel(ax, 'Y (meters)');
title(ax, 'Live Tourist Tracking');

% --- Load Anchors ---
if exist(ANCHORS_FILE, 'file')
    fid = fopen(ANCHORS_FILE);
    raw = fread(fid, inf);
    str = char(raw');
    fclose(fid);
    anchors = jsondecode(str);
    
    % Plot Anchors
    anchorNames = fieldnames(anchors);
    for i = 1:numel(anchorNames)
        key = anchorNames{i};
        a = anchors.(key);
        
        % Plot Anchor
        plot(ax, a.x, a.y, 'rs', 'MarkerSize', 10, 'MarkerFaceColor', 'r');
        text(ax, a.x, a.y + 0.5, key, 'Color', 'r', 'HorizontalAlignment', 'center');
    end
else
    warning('Anchors file not found. Plotting without static anchors.');
end

% --- Main Loop ---
disp('Starting live tracking... Press Ctrl+C to stop.');

try
    while ishandle(hFig)
        % 1. Fetch Data
        try
            response = webread(API_URL);
            
            % Handle "successResponse" wrapper: { success: true, data: {...} }
            if isstruct(response) && isfield(response, 'data')
                data = response.data;
            else
                data = response;
            end
            
            % Clear previous dynamic objects (Tourists)
            % Note: "Tag" property is used to identify dynamic objects
            delete(findobj(ax, 'Tag', 'tourist'));
            delete(findobj(ax, 'Tag', 'tourist_label'));
            
            if isfield(data, 'tourists') && ~isempty(data.tourists)
                tourists = data.tourists;
                
                % Handle if 'tourists' is a struct array or cell array
                % webread usually returns a struct array if uniform, or cell if not.
                % jsondecode (used internally) returns struct array.
                
                numTourists = numel(tourists);
                for i = 1:numTourists
                    if numTourists == 1
                        t = tourists; % Single struct
                    else
                        t = tourists(i); % Array
                    end
                    
                    % Extract Location
                    if isfield(t, 'last_location') && ~isempty(t.last_location)
                         % Check if last_location is a struct (it should be)
                         if isstruct(t.last_location)
                             loc = t.last_location;
                             x = loc.x;
                             y = loc.y;
                         else
                             % Handle null/empty cases
                             continue; 
                         end
                    else
                        continue;
                    end
                    
                    % Determine Color based on Status
                    color = 'b'; % Default Active
                    if strcmpi(t.status, 'SOS')
                        color = 'r';
                    elseif strcmpi(t.status, 'inactive')
                        color = [0.5 0.5 0.5]; % Grey
                    end
                    
                    % Plot Tourist
                    plot(ax, x, y, 'o', 'MarkerSize', 8, 'MarkerFaceColor', color, ...
                        'Tag', 'tourist');
                    
                    % Label
                    label = sprintf('%s\n(%s)', t.name, t.device_id);
                    text(ax, x, y - 0.5, label, 'Color', 'k', ...
                        'HorizontalAlignment', 'center', 'FontSize', 8, 'Tag', 'tourist_label');
                end
            end
            
            title(ax, sprintf('Live Tourist Tracking (Updated: %s)', datestr(now, 'HH:MM:SS')));
            
        catch ME
            fprintf('Error fetching data: %s\n', ME.message);
            title(ax, 'Connection Error - Retrying...');
        end
        
        % 2. Update Plot
        drawnow;
        
        % 3. Wait
        pause(REFRESH_RATE);
    end
catch
    disp('Tracking stopped.');
end

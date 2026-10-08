# Stdio MCP server that echoes a message back to the caller.
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$WarningPreference = 'SilentlyContinue'
$InformationPreference = 'SilentlyContinue'
$VerbosePreference = 'SilentlyContinue'

$utf8 = New-Object System.Text.UTF8Encoding $false
$writer = New-Object System.IO.StreamWriter([Console]::OpenStandardOutput(), $utf8)
$writer.NewLine = "`n"
$writer.AutoFlush = $true

function Send-Json([hashtable]$Message) {
    $json = $Message | ConvertTo-Json -Compress -Depth 20
    $writer.WriteLine($json)
}

function New-TextResult([string]$Text, [bool]$IsError) {
    return @{
        content = @(
            @{
                type = 'text'
                text = $Text
            }
        )
        isError = $IsError
    }
}

while ($null -ne ($line = [Console]::In.ReadLine())) {
    if ([string]::IsNullOrWhiteSpace($line)) {
        continue
    }

    try {
        $msg = $line | ConvertFrom-Json
    }
    catch {
        continue
    }

    $hasId = $null -ne $msg.PSObject.Properties['id']
    if (-not $hasId) {
        continue
    }

    $id = $msg.id
    $method = [string]$msg.method

    switch ($method) {
        'initialize' {
            $version = '2024-11-05'
            if ($msg.params.protocolVersion) {
                $version = [string]$msg.params.protocolVersion
            }
            Send-Json @{
                jsonrpc = '2.0'
                id = $id
                result = @{
                    protocolVersion = $version
                    capabilities = @{
                        tools = @{ listChanged = $false }
                    }
                    serverInfo = @{
                        name = 'echo-windows'
                        version = '1.0.0'
                    }
                }
            }
        }
        'ping' {
            Send-Json @{
                jsonrpc = '2.0'
                id = $id
                result = @{}
            }
        }
        'tools/list' {
            Send-Json @{
                jsonrpc = '2.0'
                id = $id
                result = @{
                    tools = @(
                        @{
                            name = 'echo'
                            description = 'Returns the message it receives'
                            inputSchema = @{
                                type = 'object'
                                properties = @{
                                    message = @{
                                        type = 'string'
                                        description = 'Message to echo'
                                    }
                                }
                                required = @('message')
                            }
                        }
                    )
                }
            }
        }
        'tools/call' {
            $tool = [string]$msg.params.name
            if ($tool -ne 'echo') {
                Send-Json @{
                    jsonrpc = '2.0'
                    id = $id
                    result = (New-TextResult "Unknown tool: $tool" $true)
                }
                continue
            }

            $messageProperty = $null
            if ($msg.params.arguments) {
                $messageProperty = $msg.params.arguments.PSObject.Properties['message']
            }
            if ($null -eq $messageProperty) {
                Send-Json @{
                    jsonrpc = '2.0'
                    id = $id
                    result = (New-TextResult 'Missing required argument: message' $true)
                }
                continue
            }

            Send-Json @{
                jsonrpc = '2.0'
                id = $id
                result = (New-TextResult ([string]$messageProperty.Value) $false)
            }
        }
        default {
            Send-Json @{
                jsonrpc = '2.0'
                id = $id
                error = @{
                    code = -32601
                    message = "Method not found: $method"
                }
            }
        }
    }
}

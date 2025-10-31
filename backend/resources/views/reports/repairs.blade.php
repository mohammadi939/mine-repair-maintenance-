<!DOCTYPE html>
<html lang="fa">
<head>
    <meta charset="utf-8">
    <title>گزارش تعمیرات</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; direction: rtl; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #333; padding: 6px; font-size: 12px; }
        th { background: #f2f2f2; }
    </style>
</head>
<body>
<h1>گزارش تعمیرات تجهیزات</h1>
<table>
    <thead>
    <tr>
        @foreach(array_keys($items->first() ?? []) as $header)
            <th>{{ $header }}</th>
        @endforeach
    </tr>
    </thead>
    <tbody>
    @foreach($items as $row)
        <tr>
            @foreach($row as $value)
                <td>{{ $value }}</td>
            @endforeach
        </tr>
    @endforeach
    </tbody>
</table>
</body>
</html>

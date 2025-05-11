import boto3
session = boto3.Session(profile_name='prod')
r53_client = session.client('route53')
hosted_zone_id = "ZLE44URTUKN45"
# Define mappings: CNAME record → target endpoint
records = {
    'tinyurl-store.cname.prod.dreamplug.net': 'shared-tinyurlstore-aps1a-001.as.db.prod.dreamplug.net'
}
for cname, target in records.items():
    try:
        response = r53_client.change_resource_record_sets(
            HostedZoneId=hosted_zone_id,
            ChangeBatch={
                'Changes': [
                    {
                        'Action': 'UPSERT',
                        'ResourceRecordSet': {
                            'Name': cname,
                            'Type': 'CNAME',
                            'TTL': 60,
                            'ResourceRecords': [
                                {
                                    'Value': targetsafarri
                                },
                            ],
                        }
                    },
                ]
            }
        )
        print(f"Updated CNAME: {cname} -> {target}")
    except Exception as e:
        print(f"Error updating {cname}: {e}")
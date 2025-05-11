import boto3
import yaml
import sys

def load_yaml_records(yaml_file):
    """Load Route53 record names from YAML file"""

    with open(yaml_file, 'r') as file:
        config = yaml.safe_load(file)
    return config.get('route53_records', [])

def get_route53_record_targets(session, record_names):
    """Get the targets for specific Route53 records"""

    route53 = session.client('route53')
    zones_response = route53.list_hosted_zones()
    results = []
    
    for zone in zones_response['HostedZones']:
        zone_id = zone['Id']
        zone_name = zone['Name']
        #pagination
        paginator = route53.get_paginator('list_resource_record_sets')
        page_iterator = paginator.paginate(HostedZoneId=zone_id)
        for page in page_iterator:
            for record in page['ResourceRecordSets']:
                
                record_name = record['Name']

                if any(record_name.startswith(name) for name in record_names):
                    record_type = record['Type']
                    target = "N/A"
                    resource_type = "Unknown"
                    if 'ResourceRecords' in record:
                        target = ", ".join([r['Value'] for r in record['ResourceRecords']])
                    elif 'AliasTarget' in record:
                        target = record['AliasTarget']['DNSName']
                        resource_type = "Alias"
                    results.append({
                        'Record': record_name,
                        'Type': record_type,
                        'Target': target,
                        'HostedZone': zone_name,
                        'ResourceType': resource_type
                    })
    return results

def main():
    if len(sys.argv) < 2:
        print("Usage: python route53_lookup.py records.yaml")
        sys.exit(1)

    yaml_file = sys.argv[1]
    record_names = load_yaml_records(yaml_file)
    session = boto3.Session(region_name='ap-south-1')  
    results = get_route53_record_targets(session, record_names)
    
    print("\nRoute53 Record Mapping:")
    print("="*80)
    print(f"{'Record Name':<40} {'Type':<10} {'Target'}")
    print("-"*80)
    for item in results:
        print(f"{item['Record']:<40} {item['Type']:<10} {item['Target']}")
if __name__ == "__main__":
    main()
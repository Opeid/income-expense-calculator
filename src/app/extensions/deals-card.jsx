import {
  Button,
  Divider,
  Flex,
  Text,
  hubspot,
} from "@hubspot/ui-extensions";

// Entry point for the UI extension
hubspot.extend(({ context, runServerlessFunction, actions }) => (
  <DealsCard
    context={context}
    runServerlessFunction={runServerlessFunction}
    actions={actions}
  />
));

const DealsCard = ({ context, runServerlessFunction, actions }) => {
  const dealId = context.crm.objectId;

  return (
    <Flex direction="column" gap="md">
      <Text format={{ fontWeight: "bold" }}>Deal ID</Text>
      <Text>{dealId}</Text>
      <Divider />
      <Button
        onClick={() =>
          actions.openCrmRecord({
            objectTypeId: "0-3",
            objectId: dealId,
          })
        }
      >
        Open Deal Record
      </Button>
    </Flex>
  );
};

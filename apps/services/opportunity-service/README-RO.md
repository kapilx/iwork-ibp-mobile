## Renewal Opportunity 

- RO = Opportunity which has type as RO



### RO Creation 
- Need to Handle through Cron Job 
    - Cron need to perfomr 2 tasks 
    - Will run Daily once (Time can be decided)
    - Task 1 : To check the Policy End date and perform the following 
        - Create Opportunity of type RO 
            - Start Date  = Policy End Date -365  / Based on Config 
            - End date of RO  =  Policy Expiry Data
        - Task 2 : Check the opportunity status Lost and perform the following 
            - Create Opportunity of type RO 
                - Start Date = Opportunity lost date 
                - End date of RO  = From Start Date + 1 Year

        - The above 2 Tasks we need to gather data for the mandatory columns of Opportunity object
        - While creating the RO , the activities also need to be created same as SO 


Once the Opty lost 
    creating new SO with start date as the lost date and end date will be 365 days 



    Policy 
    RO will be create on the same date and 365 days will be end date 


        


